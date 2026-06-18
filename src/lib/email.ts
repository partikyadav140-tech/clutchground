"use server";
import { getEnvVar } from "./env";

/**
 * Generates a cryptographically random 6-digit OTP string.
 */
export function generateOtp(): string {
  const digits = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(digits)
    .map((b) => b % 10)
    .join("");
}

/**
 * Sends an OTP verification email using Resend.
 * Falls back to console.log in development if RESEND_API_KEY is not set.
 */
export async function sendOtpEmail(
  to: string,
  otp: string,
  purpose: "signup" | "forgot_password",
): Promise<void> {
  const apiKey = getEnvVar("RESEND_API_KEY");
  const fromEmail = getEnvVar("RESEND_FROM_EMAIL") || "noreply@clutchground.games";

  const subject =
    purpose === "signup"
      ? "Your ClutchGround Verification Code"
      : "Reset Your ClutchGround Password";

  const heading =
    purpose === "signup"
      ? "Verify your email to join ClutchGround"
      : "Reset your ClutchGround password";

  const body =
    purpose === "signup"
      ? "You're almost there! Use the code below to verify your email address."
      : "Use the code below to reset your password. If you didn't request this, ignore this email.";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#12121a;border:1px solid #1e1e2e;border-radius:24px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#00c8ff);padding:32px 40px;text-align:center;">
              <div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:2px;text-transform:uppercase;">CLUTCHGROUND</div>
              <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;letter-spacing:1px;">FREE FIRE ESPORTS</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#fff;font-size:20px;margin:0 0 12px;font-weight:700;">${heading}</h2>
              <p style="color:#a0a0b8;font-size:14px;margin:0 0 32px;line-height:1.6;">${body}</p>

              <!-- OTP Box -->
              <div style="background:#1a1a2e;border:2px solid #7c3aed;border-radius:16px;padding:24px;text-align:center;margin:0 0 32px;">
                <div style="font-size:11px;color:#7c3aed;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;">Verification Code</div>
                <div style="font-size:40px;font-weight:900;color:#fff;letter-spacing:12px;font-family:'Courier New',monospace;">${otp}</div>
                <div style="font-size:12px;color:#6b6b8a;margin-top:12px;">Expires in 10 minutes</div>
              </div>

              <p style="color:#6b6b8a;font-size:12px;text-align:center;margin:0;">
                If you didn't request this, you can safely ignore this email.<br/>
                Never share your OTP with anyone.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#0d0d18;padding:20px 40px;text-align:center;border-top:1px solid #1e1e2e;">
              <p style="color:#4a4a6a;font-size:11px;margin:0;">© 2025 ClutchGround. India's Free Fire Esports Arena.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // Log OTP to server console only in development (NEVER in production)
  const isProd = getEnvVar("NODE_ENV") === "production";
  if (!isProd) {
    console.log(`\n[Email OTP] ────────────────────────────────`);
    console.log(`[Email OTP] PURPOSE : ${purpose.toUpperCase()}`);
    console.log(`[Email OTP] TO      : ${to}`);
    console.log(`[Email OTP] OTP CODE: ${otp}`);
    console.log(`[Email OTP] ────────────────────────────────\n`);
  }

  if (!apiKey) {
    const isProd = getEnvVar("NODE_ENV") === "production";
    if (isProd) {
      throw new Error("Email service not configured. Please contact support.");
    }
    console.warn("[Email OTP] RESEND_API_KEY not set — DEV MODE: use OTP from console above.");
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const result = await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    html,
  });

  console.log("[Resend] Response:", JSON.stringify(result));

  if (result.error) {
    console.error("[Resend] ERROR:", result.error);
    // Still don't block the user — OTP is in DB, they can use console OTP
    // But surface the real error message
    const msg = (result.error as any)?.message || JSON.stringify(result.error);
    throw new Error(`Email delivery failed: ${msg}. Check server logs for the OTP code.`);
  }

  console.log("[Resend] Email sent successfully. ID:", (result.data as any)?.id);
}

/**
 * Sends a general email using Resend.
 * Used for room details, notifications, etc.
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
): Promise<void> {
  const apiKey = getEnvVar("RESEND_API_KEY");
  const fromEmail = getEnvVar("RESEND_FROM_EMAIL") || "noreply@clutchground.games";

  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY not set — skipping email to", to);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const result = await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    html: htmlBody,
  });

  if (result.error) {
    console.error("[Email] Send error:", result.error);
  }
}
