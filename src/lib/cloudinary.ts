"use server";
import { getEnvVar } from "./env";

const CLOUD_NAME = getEnvVar("CLOUDINARY_CLOUD_NAME");
const API_KEY = getEnvVar("CLOUDINARY_API_KEY");
const API_SECRET = getEnvVar("CLOUDINARY_API_SECRET");

/**
 * Upload a base64 image or URL to Cloudinary.
 * Returns the secure URL of the uploaded image.
 */
export async function uploadToCloudinary(
  fileBase64OrUrl: string,
  folder: string = "clutchground",
): Promise<string> {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    // Cloudinary not configured yet — return the URL as-is (graceful fallback)
    console.warn("[Cloudinary] Not configured. Returning original URL.");
    return fileBase64OrUrl;
  }

  const timestamp = Math.round(Date.now() / 1000);

  // Build signature
  const signaturePayload = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
  const signature = await sha1(signaturePayload);

  const formData = new FormData();
  formData.append("file", fileBase64OrUrl);
  formData.append("api_key", API_KEY);
  formData.append("timestamp", timestamp.toString());
  formData.append("folder", folder);
  formData.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Cloudinary upload failed: ${err}`);
  }

  const result = (await response.json()) as { secure_url: string };
  return result.secure_url;
}

/**
 * Delete a resource from Cloudinary using its URL.
 */
export async function deleteFromCloudinary(url: string): Promise<boolean> {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    console.warn("[Cloudinary] Not configured. Skipping deletion.");
    return false;
  }

  try {
    const uploadMarker = "/image/upload/";
    const markerIndex = url.indexOf(uploadMarker);
    if (markerIndex === -1) {
      console.warn("[Cloudinary] Invalid URL, could not find upload marker:", url);
      return false;
    }

    let path = url.substring(markerIndex + uploadMarker.length);
    // Remove version component (e.g. v1726000000/) if present
    if (path.startsWith("v") && /^\d+\//.test(path.substring(1))) {
      const slashIndex = path.indexOf("/");
      if (slashIndex !== -1) {
        path = path.substring(slashIndex + 1);
      }
    }

    // Remove file extension
    const dotIndex = path.lastIndexOf(".");
    if (dotIndex !== -1) {
      path = path.substring(0, dotIndex);
    }

    const publicId = path;
    const timestamp = Math.round(Date.now() / 1000);
    const signaturePayload = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
    const signature = await sha1(signaturePayload);

    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("api_key", API_KEY);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[Cloudinary] Delete failed:", err);
      return false;
    }

    const result = (await response.json()) as { result: string };
    return result.result === "ok";
  } catch (error) {
    console.error("[Cloudinary] Delete error:", error);
    return false;
  }
}

/** Simple SHA-1 using Web Crypto API */
async function sha1(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
