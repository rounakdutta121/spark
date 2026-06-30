import { getAppName } from "@/lib/email/email.config";

export interface EmailLayoutInput {
  title: string;
  previewText: string;
  bodyHtml: string;
  bodyText: string;
}

export function renderEmailLayout(input: EmailLayoutInput): {
  html: string;
  text: string;
} {
  const appName = getAppName();
  const year = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${input.title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
    <span style="display:none;max-height:0;overflow:hidden;">${input.previewText}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 24px;font-size:20px;font-weight:700;color:#ff4458;">${appName}</p>
                ${input.bodyHtml}
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-size:12px;color:#71717a;">&copy; ${year} ${appName}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${appName}\n\n${input.bodyText}\n\n© ${year} ${appName}`;

  return { html, text };
}

export function renderButton(href: string, label: string): string {
  return `<p style="margin:24px 0;">
    <a href="${href}" style="display:inline-block;background:#ff4458;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px;">${label}</a>
  </p>
  <p style="margin:0;font-size:13px;color:#71717a;word-break:break-all;">${href}</p>`;
}
