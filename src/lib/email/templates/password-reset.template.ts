import { getAppName } from "@/lib/email/email.config";
import { renderButton, renderEmailLayout } from "@/lib/email/templates/base.template";

export interface PasswordResetEmailInput {
  name: string;
  resetLink: string;
}

export function passwordResetEmailTemplate(input: PasswordResetEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const appName = getAppName();
  const subject = `Reset your ${appName} password`;

  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">Reset your password</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hi ${input.name},</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      We received a request to reset your ${appName} password. Click the button below to choose a new password.
    </p>
    ${renderButton(input.resetLink, "Reset password")}
    <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#71717a;">
      This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.
    </p>`;

  const bodyText = `Hi ${input.name},

We received a request to reset your ${appName} password.

Reset your password: ${input.resetLink}

This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.`;

  const { html, text } = renderEmailLayout({
    title: subject,
    previewText: `Reset your ${appName} password.`,
    bodyHtml,
    bodyText,
  });

  return { subject, html, text };
}
