import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const rawUser = process.env.SMTP_USER || process.env.GMAIL_USER;
const rawPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;
const cleanPass = rawPass ? rawPass.trim().replace(/\s+/g, "") : undefined;
const smtpUser = rawUser ? rawUser.trim() : undefined;
const targetEmail = process.argv[2] || smtpUser;

console.log("\n==========================================");
console.log("RepoMind Email Configuration Diagnostic");
console.log("==========================================");
console.log(`GMAIL_USER / SMTP_USER: ${smtpUser ? smtpUser : "(NOT SET in .env)"}`);
console.log(`GMAIL_PASS / SMTP_PASS: ${cleanPass ? "****** (Length: " + cleanPass.length + ")" : "(NOT SET in .env)"}`);

if (!smtpUser || !cleanPass) {
  console.log("\n❌ Status: Email credentials are NOT configured in .env.");
  console.log("\nTo enable real email delivery to your Gmail inbox:");
  console.log("1. Go to https://myaccount.google.com/apppasswords");
  console.log("2. Generate a 16-character App Password named 'RepoMind'");
  console.log("3. Add to your .env file:");
  console.log('   GMAIL_USER="your-email@gmail.com"');
  console.log('   GMAIL_PASS="xxxx xxxx xxxx xxxx"');
  console.log("\n==========================================\n");
  process.exit(0);
}

console.log(`\nAttempting test email delivery to: ${targetEmail}...`);

const isGmail = smtpUser.toLowerCase().includes("@gmail.com");

const transporter = isGmail
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: cleanPass,
      },
    })
  : nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (Number(process.env.SMTP_PORT) || 465) === 465,
      auth: {
        user: smtpUser,
        pass: cleanPass,
      },
    });

try {
  console.log("Verifying SMTP connection...");
  await transporter.verify();
  console.log("✅ SMTP Server connection verified successfully!");

  const info = await transporter.sendMail({
    from: `"RepoMind Support" <${smtpUser}>`,
    to: targetEmail,
    subject: "RepoMind Test Email - Password Reset System Active",
    html: `
      <div style="font-family: sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb;">RepoMind Email System is Operational!</h2>
        <p>This email confirms that your Gmail SMTP configuration in RepoMind is working properly.</p>
        <p>Password reset emails will now be delivered directly to user inboxes.</p>
      </div>
    `,
  });

  console.log(`✅ Success! Test email delivered to ${targetEmail} (MessageId: ${info.messageId})`);
  console.log("==========================================\n");
} catch (err) {
  console.error("\n❌ Failed to send email via SMTP:");
  console.error(err.message || err);
  if (err.message && err.message.includes("Username and Password not accepted")) {
    console.log("\n💡 Tip: Google rejected the password. Please make sure you are using a 16-character 'App Password' from https://myaccount.google.com/apppasswords, NOT your regular personal Gmail password.");
  }
  console.log("==========================================\n");
}
