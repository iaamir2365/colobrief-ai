import { MailtrapClient } from "mailtrap";

const MAILTRAP_TOKEN = process.env.MAILTRAP_TOKEN || "3a156cfaf31785e6473ffc377a81fb29";
const SENDER_EMAIL = process.env.MAILTRAP_SENDER_EMAIL || "hello@mail.goldpriceinfo.com";
const SENDER_NAME = process.env.MAILTRAP_SENDER_NAME || "ColoBrief AI";

const client = new MailtrapClient({
  token: MAILTRAP_TOKEN,
});

const sender = {
  email: SENDER_EMAIL,
  name: SENDER_NAME,
};

/**
 * Send an email verification code to the user.
 * Uses Mailtrap for delivery.
 */
export async function sendVerificationEmail(toEmail: string, code: string): Promise<boolean> {
  try {
    await client.send({
      from: sender,
      to: [{ email: toEmail }],
      subject: "ColoBrief AI — Email Verification Code",
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f0fdfa; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #0d9488, #059669); color: white; font-size: 24px;">
              ❤️
            </div>
            <h1 style="margin: 12px 0 4px; font-size: 20px; color: #0f172a;">ColoBrief AI</h1>
            <p style="margin: 0; font-size: 13px; color: #64748b;">Empathetic UC Symptom Tracking</p>
          </div>
          <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
            <h2 style="margin: 0 0 8px; font-size: 16px; color: #0f172a;">Verify Your Email</h2>
            <p style="margin: 0 0 20px; font-size: 14px; color: #475569; line-height: 1.6;">
              Enter this verification code to confirm your email address and access ColoBrief AI:
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <span style="display: inline-block; font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0d9488; background: #f0fdfa; padding: 16px 32px; border-radius: 12px; border: 2px dashed #99f6e4;">
                ${code}
              </span>
            </div>
            <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
              This code expires in 10 minutes. If you didn't request this, you can ignore this email.
            </p>
          </div>
          <p style="margin: 16px 0 0; font-size: 11px; color: #94a3b8; text-align: center;">
            ColoBrief AI — Bridging daily flares and clinical consultations
          </p>
        </div>
      `,
      category: "Email Verification",
    });
    return true;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return false;
  }
}