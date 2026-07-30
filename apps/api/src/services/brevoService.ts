import pino from 'pino';
import nodemailer from 'nodemailer';
import { envConfig } from '../config/env.js';

const logger = pino({ name: 'BrevoService' });

/**
 * Brevo (formerly Sendinblue) Transactional Email Service
 * Uses Brevo API v3 and Nodemailer SMTP relay to send 6-digit OTP emails.
 */
export class BrevoService {
  private static getApiKey(): string | null {
    return (
      process.env.SMTP_KEY ||
      envConfig.SMTP_KEY ||
      process.env.BREVO_API_KEY ||
      process.env.SMTP_BREVO ||
      null
    );
  }

  private static getSmtpUser(): string {
    return process.env.SMTP_USER || 'a0d5cf001@smtp-brevo.com';
  }

  private static getSenderEmail(): string {
    return process.env.EMAIL_FROM || envConfig.EMAIL_FROM || 'noreply@zegaai.site';
  }

  /**
   * Send 6-digit OTP email to user
   */
  static async sendOtpEmail({
    email,
    otp,
    fullName = 'ZEGA Enterprise User',
    segment = 'individual',
  }: {
    email: string;
    otp: string;
    fullName?: string;
    segment?: 'individual' | 'enterprise';
  }): Promise<{ success: boolean; messageId?: string; devMode?: boolean }> {
    const apiKey = this.getApiKey();
    const smtpUser = this.getSmtpUser();
    const senderEmail = this.getSenderEmail();

    const portalName = segment === 'enterprise' ? 'ZEGA Enterprise Workspace' : 'ZEGA AI Sandbox Portal';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ZEGA AI Security Verification</title>
</head>
<body style="margin:0; padding:0; background-color:#0a0b10; font-family:'Plus Jakarta Sans', Inter, -apple-system, sans-serif; color:#f8fafc;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0a0b10; padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="500px" border="0" cellspacing="0" cellpadding="0" style="max-width:500px; background-color:#11131c; border:1px solid #222638; border-radius:16px; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.6);">
          
          <!-- Header Bar -->
          <tr>
            <td style="padding:28px 32px; background-color:#161926; border-bottom:1px solid #222638; text-align:center;">
              <div style="font-family:monospace; font-size:11px; font-weight:800; tracking:0.25em; color:#ff6b35; text-transform:uppercase; margin-bottom:6px;">
                SECURITY VERIFICATION GATEWAY
              </div>
              <div style="font-size:22px; font-weight:900; letter-spacing:-0.03em; color:#ffffff;">
                ZEGA<span style="color:#ff6b35;">.AI</span> CONSOLE
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:32px; text-align:left;">
              <h2 style="font-size:18px; font-weight:700; color:#ffffff; margin:0 0 12px 0;">
                One-Time Security Passcode (OTP)
              </h2>
              <p style="font-size:13px; color:#94a3b8; line-height:1.6; margin:0 0 24px 0;">
                Hello <strong style="color:#f8fafc;">${fullName}</strong>,<br>
                Use the 6-digit verification code below to complete your secure authentication into <strong>${portalName}</strong>.
              </p>

              <!-- OTP Box -->
              <div style="background-color:#0a0b10; border:1px dashed #ff6b35; border-radius:12px; padding:20px; text-align:center; margin-bottom:24px;">
                <div style="font-family:monospace; font-size:32px; font-weight:900; letter-spacing:0.3em; color:#ffffff; text-shadow:0 0 10px rgba(255,107,53,0.4);">
                  ${otp}
                </div>
                <div style="font-size:11px; color:#64748b; margin-top:8px;">
                  ⏱️ Code expires in <strong>5 minutes</strong>. Do not share this code with anyone.
                </div>
              </div>

              <p style="font-size:12px; color:#64748b; line-height:1.5; margin:0;">
                If you did not request this verification passcode, please disregard this message or contact your platform administrator immediately.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px; background-color:#0d0e15; border-top:1px solid #1e2235; text-align:center; font-size:11px; color:#475569;">
              © 2026 ZEGA AI Enterprise Architecture • Zero-Trust Access Gateway
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    if (!apiKey) {
      logger.warn(`[BrevoService] No BREVO_API_KEY / SMTP_KEY configured. [DEV SIMULATION MODE] OTP for ${email}: ${otp}`);
      return { success: true, messageId: 'simulated-' + Date.now(), devMode: true };
    }

    const isSmtpKey = apiKey.startsWith('xsmtpsib-');

    // 1. Primary Route: Attempt Brevo HTTP API v3 if key is an API Key (xkeysib- or non-xsmtp)
    if (!isSmtpKey) {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            sender: { name: 'ZEGA AI Gatekeeper', email: senderEmail },
            to: [{ email, name: fullName }],
            subject: `[ZEGA AI] ${otp} is your Security Passcode`,
            htmlContent,
          }),
        });

        if (response.ok) {
          const resData = (await response.json()) as { messageId?: string };
          logger.info(`[BrevoService] Successfully sent OTP email via Brevo HTTP API to ${email}. MessageID: ${resData.messageId}`);
          return { success: true, messageId: resData.messageId };
        }

        const errorText = await response.text();
        logger.warn(`[BrevoService] Brevo HTTP API status ${response.status} (${errorText}). Falling back to Nodemailer Brevo SMTP Relay... [OTP for ${email}: ${otp}]`);
      } catch (apiErr) {
        logger.warn({ err: apiErr }, `[BrevoService] Brevo HTTP API error. Falling back to Nodemailer Brevo SMTP Relay... [OTP for ${email}: ${otp}]`);
      }
    } else {
      logger.info(`[BrevoService] Detected Brevo SMTP Key (xsmtpsib-). Directing to Nodemailer Brevo SMTP Relay with user ${smtpUser}...`);
    }

    // 2. Secondary Route: Nodemailer SMTP Relay via Brevo SMTP Server (with 4s connection timeout)
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 5000,
        auth: {
          user: smtpUser,
          pass: apiKey,
        },
      });

      const info = await transporter.sendMail({
        from: `"ZEGA AI Gatekeeper" <${senderEmail}>`,
        replyTo: senderEmail,
        to: email,
        subject: `[ZEGA AI] ${otp} is your Security Passcode`,
        html: htmlContent,
      });

      logger.info(`[BrevoService] Successfully sent OTP email via Brevo SMTP Relay to ${email} (From: ${senderEmail}). MessageID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (smtpErr: any) {
      if (smtpErr?.responseCode === 525 || smtpErr?.message?.includes('525')) {
        logger.error(
          `[BrevoService] Brevo SMTP Relay rejected connection (525 Unauthorized IP address). ` +
          `Solution: Go to Brevo Dashboard -> SMTP & API -> Authorized IP Addresses to disable IP restriction or generate a v3 API Key (xkeysib-...).`
        );
      } else {
        logger.error({ err: smtpErr }, `[BrevoService] Failed to send email via Brevo SMTP Relay (Timeout/Error).`);
      }
      return { success: false, messageId: 'smtp-timeout-' + Date.now(), devMode: true };
    }
  }
}
