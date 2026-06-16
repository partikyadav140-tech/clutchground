/**
 * One-time script to upload Free Fire map images to Cloudinary.
 * Usage: node upload-maps.cjs
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Load env from .env file
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error("Missing Cloudinary credentials in .env");
  process.exit(1);
}

const MAPS = [
  { key: "lone_wolf", file: "C:\\tmp\\lone wolf.png" },
  { key: "nextera", file: "C:\\tmp\\nextera.png" },
  { key: "purgatory", file: "C:\\tmp\\purgatory.png" },
  { key: "solara", file: "C:\\tmp\\solara.png" },
  { key: "alpine", file: "C:\\tmp\\alpine.png" },
  { key: "bermuda", file: "C:\\tmp\\bermuda.png" },
  { key: "clash_squad", file: "C:\\tmp\\clash squad.png" },
  { key: "kalahari", file: "C:\\tmp\\kalahari.png" },
];

function sha1(str) {
  return crypto.createHash("sha1").update(str).digest("hex");
}

async function uploadToCloudinary(filePath, folder, publicId) {
  const base64 = fs.readFileSync(filePath, { encoding: "base64" });
  const mimeType = "image/png";
  const dataUri = `data:${mimeType};base64,${base64}`;

  const timestamp = Math.floor(Date.now() / 1000);
  const signaturePayload = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
  const signature = sha1(signaturePayload);

  const formBody = new URLSearchParams();
  formBody.append("file", dataUri);
  formBody.append("api_key", API_KEY);
  formBody.append("timestamp", String(timestamp));
  formBody.append("folder", folder);
  formBody.append("public_id", publicId);
  formBody.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formBody,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed for ${publicId}: ${err}`);
  }

  const json = await res.json();
  return json.secure_url;
}

async function main() {
  console.log("Uploading map images to Cloudinary...\n");

  const results = {};

  for (const map of MAPS) {
    if (!fs.existsSync(map.file)) {
      console.error(`  ✗ File not found: ${map.file}`);
      continue;
    }
    process.stdout.write(`  Uploading ${map.key}...`);
    try {
      const url = await uploadToCloudinary(map.file, "clutchground/maps", map.key);
      results[map.key] = url;
      console.log(` ✓ ${url}`);
    } catch (err) {
      console.error(` ✗ ${err.message}`);
    }
  }

  console.log("\n\n=== Copy this into mode-colors.ts ===\n");
  console.log("export const MAP_IMAGES: Record<string, string> = {");
  for (const [key, url] of Object.entries(results)) {
    console.log(`  ${key}: "${url}",`);
  }
  console.log("};");
}

main().catch(console.error);
