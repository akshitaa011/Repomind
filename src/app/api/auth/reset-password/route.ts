import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { hashPassword } from "better-auth/crypto";
import { sendPasswordResetEmail } from "~/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, token, newPassword } = body;

    // =========================================================================
    // 1. SEND RESET LINK (Verifies DB existence, generates token, sends email)
    // =========================================================================
    if (action === "send-reset-link" || action === "check-email") {
      if (!email || typeof email !== "string") {
        return NextResponse.json(
          { success: false, error: "Please provide a valid email address." },
          { status: 400 }
        );
      }

      const cleanEmail = email.trim().toLowerCase();

      // 1. Check if user exists in database
      const user = await db.user.findUnique({
        where: { email: cleanEmail },
      });

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: "No account found with this email address. Please verify your email or sign up.",
          },
          { status: 404 }
        );
      }

      // 2. Generate secure 64-character hex token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

      // Remove any previously generated unused tokens for this email
      await db.verification.deleteMany({
        where: {
          identifier: `reset-password:${cleanEmail}`,
        },
      });

      // Save token to verification table
      await db.verification.create({
        data: {
          id: crypto.randomUUID(),
          identifier: `reset-password:${cleanEmail}`,
          value: resetToken,
          expiresAt,
        },
      });

      // 3. Build reset URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
      const resetUrl = `${appUrl.replace(/\/$/, "")}/reset-password?token=${resetToken}`;

      // 4. Send email via SMTP / Resend / Local Fallback
      const emailResult = await sendPasswordResetEmail({
        to: cleanEmail,
        resetUrl,
      });

      const isLiveEmail = emailResult.method === "smtp" || emailResult.method === "resend";

      return NextResponse.json({
        success: true,
        message: isLiveEmail
          ? `A password reset email has been sent to ${cleanEmail}. Please check your inbox and spam folder.`
          : `Password reset link generated for ${cleanEmail}.`,
        email: cleanEmail,
        method: emailResult.method,
        smtpError: (emailResult as any).smtpError,
        resetUrl, // Always passed so the user can immediately reset in dev / local mode
      });
    }

    // =========================================================================
    // 2. VERIFY TOKEN (Used when user clicks the link from their email)
    // =========================================================================
    if (action === "verify-token") {
      if (!token || typeof token !== "string") {
        return NextResponse.json(
          { success: false, error: "Missing password reset token." },
          { status: 400 }
        );
      }

      const verification = await db.verification.findFirst({
        where: {
          value: token.trim(),
          expiresAt: { gt: new Date() },
        },
      });

      if (!verification) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid or expired password reset link. Please request a new one.",
          },
          { status: 400 }
        );
      }

      const verifiedEmail = verification.identifier.replace("reset-password:", "");

      return NextResponse.json({
        success: true,
        email: verifiedEmail,
      });
    }

    // =========================================================================
    // 3. RESET PASSWORD (Verifies token, updates password, deletes token)
    // =========================================================================
    if (action === "reset-password") {
      if (!token || typeof token !== "string") {
        return NextResponse.json(
          { success: false, error: "Missing reset token. You must access this page via the email link." },
          { status: 400 }
        );
      }

      if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
        return NextResponse.json(
          {
            success: false,
            error: "Password must be at least 8 characters long.",
          },
          { status: 400 }
        );
      }

      // Check token validity in database
      const verification = await db.verification.findFirst({
        where: {
          value: token.trim(),
          expiresAt: { gt: new Date() },
        },
      });

      if (!verification) {
        return NextResponse.json(
          {
            success: false,
            error: "This reset link has expired or has already been used. Please request a new link.",
          },
          { status: 400 }
        );
      }

      const cleanEmail = verification.identifier.replace("reset-password:", "").trim().toLowerCase();

      // Find user
      const user = await db.user.findUnique({
        where: { email: cleanEmail },
        include: { accounts: true },
      });

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: "User not found. Cannot reset password.",
          },
          { status: 404 }
        );
      }

      // Hash password using Better Auth's cryptographic hasher
      const hashedPassword = await hashPassword(newPassword);

      // Find or create the credential account
      const credentialAccount = user.accounts.find(
        (acc) => acc.providerId === "credential"
      );

      if (credentialAccount) {
        await db.account.update({
          where: { id: credentialAccount.id },
          data: { password: hashedPassword },
        });
      } else {
        await db.account.create({
          data: {
            userId: user.id,
            accountId: user.id,
            providerId: "credential",
            password: hashedPassword,
          },
        });
      }

      // Invalidate token so it can never be used again
      await db.verification.delete({
        where: { id: verification.id },
      });

      return NextResponse.json({
        success: true,
        message: "Your password has been reset successfully! Please sign in with your new password.",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error occurred.",
      },
      { status: 500 }
    );
  }
}
