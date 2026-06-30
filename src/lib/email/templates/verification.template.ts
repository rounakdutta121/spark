import { getAppName } from "@/lib/email/email.config";
import { renderButton, renderEmailLayout } from "@/lib/email/templates/base.template";

export interface VerificationEmailInput {
  name: string;
  verifyLink: string;
}

export function verificationEmailTemplate(input: VerificationEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const appName = getAppName();
  const subject = `Verify your ${appName} email`;

  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">Verify your email</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hi ${input.name},</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      Welcome to ${appName}! Please verify your email address to start sharing and connecting.
    </p>
    ${renderButton(input.verifyLink, "Verify email")}
    <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#71717a;">
      This link expires in 24 hours. If you did not create an account, you can safely ignore this email.
    </p>`;

  const bodyText = `Hi ${input.name},

Welcome to ${appName}! Please verify your email address to start sharing and connecting.

Verify your email: ${input.verifyLink}

This link expires in 24 hours. If you did not create an account, you can safely ignore this email.`;

  const { html, text } = renderEmailLayout({
    title: subject,
    previewText: `Verify your email to start using ${appName}.`,
    bodyHtml,
    bodyText,
  });

  return { subject, html, text };
}
