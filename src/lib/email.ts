import nodemailer from "nodemailer";

interface SendEmailParams {
  to: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({ to, resetUrl }: SendEmailParams) {
  const cleanTo = to.trim().toLowerCase();

  // 1. If Resend API Key is provided
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
          "Content-Type": "application/json",
          "User-Agent": "RepoMind-App/1.0",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "onboarding@resend.dev",
          to: cleanTo,
          subject: "Reset your RepoMind password",
          html: getResetEmailHtml(resetUrl, cleanTo),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        console.log(`[RepoMind Email] Sent reset email via Resend to ${cleanTo} (ID: ${data.id})`);
        return { sent: true, method: "resend", id: data.id };
      } else {
        console.warn("[RepoMind Email] Resend API error:", data);
      }
    } catch (err: any) {
      console.warn("[RepoMind Email] Resend fetch error:", err?.message || err);
    }
  }

  // 2. If SMTP / Gmail credentials are provided
  const rawUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const rawPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;
  // Automatically strip any spaces that Google includes in 16-character App Passwords
  const cleanPass = rawPass ? rawPass.trim().replace(/\s+/g, "") : undefined;
  const smtpUser = rawUser ? rawUser.trim() : undefined;
  const smtpHost = process.env.SMTP_HOST;
  const isGmail = Boolean(
    (smtpUser && smtpUser.toLowerCase().includes("@gmail")) ||
    (smtpHost && smtpHost.toLowerCase().includes("gmail"))
  );
  const smtpPort = Number(process.env.SMTP_PORT) || (isGmail ? 465 : 587);

  if (smtpUser && cleanPass) {
    try {
      const transporter = isGmail
        ? nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: smtpUser,
              pass: cleanPass,
            },
          })
        : nodemailer.createTransport({
            host: smtpHost || "smtp.gmail.com",
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser,
              pass: cleanPass,
            },
          });

      await transporter.sendMail({
        from: `"RepoMind Support" <${smtpUser}>`,
        to: cleanTo,
        subject: "Reset your RepoMind password",
        html: getResetEmailHtml(resetUrl, cleanTo),
      });

      console.log(`[RepoMind Email] Sent real reset email via SMTP/Gmail to ${cleanTo}`);
      return { sent: true, method: "smtp" };
    } catch (err: any) {
      console.error("[RepoMind Email] SMTP send failed:", err?.message || err);
      // Fallback to local resetUrl so the user is never stuck
      return {
        sent: true,
        method: "console",
        resetUrl,
        smtpError: err?.message || "SMTP authentication failed",
      };
    }
  }

  // 3. Fallback for Local Development & Testing (Console Link)
  console.log(`\n======================================================`);
  console.log(`[RepoMind Email System] PASSWORD RESET EMAIL FOR: ${cleanTo}`);
  console.log(`Reset URL: ${resetUrl}`);
  console.log(`(Configure GMAIL_USER & GMAIL_PASS in .env to deliver real emails)`);
  console.log(`======================================================\n`);

  return { sent: true, method: "console", resetUrl };
}

function getResetEmailHtml(resetUrl: string, email: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0;">RepoMind</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Password Reset Request</p>
      </div>
      
      <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
        Hello,
      </p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
        We received a request to reset the password for your RepoMind account associated with <strong>${email}</strong>. Click the button below to choose your new password:
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
          Reset My Password
        </a>
      </div>

      <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 20px;">
        This reset link will expire in <strong>1 hour</strong>. If you did not make this request, you can safely ignore this email — your password will remain unchanged.
      </p>

      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />

      <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
        If you have trouble clicking the button, copy and paste this URL into your browser:<br />
        <a href="${resetUrl}" style="color: #0284c7; word-break: break-all;">${resetUrl}</a>
      </p>
    </div>
  `;
}
