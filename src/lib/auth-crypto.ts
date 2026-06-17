"use server";
import crypto from "node:crypto";
import { getEnvVar } from "./env";

/**
 * Hash a password using scrypt with a random salt.
 * Returns a string formatted as "salt:hash".
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored "salt:hash" string.
 */
export function verifyPassword(password: string, stored: string): boolean {
  if (!stored || !stored.includes(":")) {
    // Fallback for legacy plaintext passwords during migration
    return password === stored;
  }
  const [salt, hash] = stored.split(":");
  const testHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(testHash, "hex"));
}

function getEncryptionKey(): string {
  const key = getEnvVar("ENCRYPTION_KEY");
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      console.error("[FATAL] ENCRYPTION_KEY environment variable is not set. Password encryption is insecure.");
      throw new Error("ENCRYPTION_KEY must be set in production. Password encryption cannot proceed without a secure key.");
    }
    console.warn("[SECURITY] ENCRYPTION_KEY not set — using insecure dev fallback. Set ENCRYPTION_KEY before production deployment.");
    return "default_clutchground_secret_32_bytes_key_dev!";
  }
  if (key.length < 32) {
    throw new Error("ENCRYPTION_KEY must be at least 32 bytes for AES-256.");
  }
  return key;
}

/**
 * Encrypt a password using AES-256-GCM.
 * Returns "ivHex:authTagHex:ciphertextHex".
 */
export function encryptPassword(password: string): string {
  if (!password) return "";
  const iv = crypto.randomBytes(12);
  const encKey = getEncryptionKey();
  const key = Buffer.alloc(32);
  Buffer.from(encKey).copy(key);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag.toString()}:${encrypted}`;
}

/**
 * Decrypt a password using AES-256-GCM.
 * Expects "ivHex:authTagHex:ciphertextHex".
 */
export function decryptPassword(encryptedStr: string): string | null {
  if (!encryptedStr || !encryptedStr.includes(":")) return null;
  try {
    const [ivHex, authTagHex, ciphertext] = encryptedStr.split(":");
    if (!ivHex || !authTagHex || !ciphertext) return null;

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encKey = getEncryptionKey();
    const key = Buffer.alloc(32);
    Buffer.from(encKey).copy(key);

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    console.error("[decryptPassword] Decryption failed:", e);
    return null;
  }
}
