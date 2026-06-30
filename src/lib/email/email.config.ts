const REQUIRED_SMTP_ENV_VARS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "EMAIL_FROM",
] as const;

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

export function getMissingSmtpEnvVars(): string[] {
  return REQUIRED_SMTP_ENV_VARS.filter((key) => !process.env[key]?.trim());
}

export function getSmtpConfig(): SmtpConfig | null {
  const missing = getMissingSmtpEnvVars();
  if (missing.length > 0) return null;

  const port = Number(process.env.SMTP_PORT);
  if (!Number.isFinite(port) || port <= 0) return null;

  return {
    host: process.env.SMTP_HOST!.trim(),
    port,
    user: process.env.SMTP_USER!.trim(),
    pass: process.env.SMTP_PASS!.trim(),
    from: process.env.EMAIL_FROM!.trim(),
  };
}

export function getAppName(): string {
  return process.env.NEXT_PUBLIC_APP_NAME ?? "Spark";
}

export { buildAppLink, resolveAppUrl } from "@/lib/app-url";
