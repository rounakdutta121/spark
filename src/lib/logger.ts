type LogLevel = "info" | "warn" | "error" | "debug";

interface LogMeta {
  [key: string]: unknown;
}

const SENSITIVE_KEYS = new Set([
  "password",
  "currentPassword",
  "newPassword",
  "token",
  "refreshToken",
  "accessToken",
  "smtpPass",
  "secret",
]);

function sanitizeMeta(meta?: LogMeta): LogMeta | undefined {
  if (!meta) return undefined;
  const clean: LogMeta = {};
  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = "[REDACTED]";
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

function write(level: LogLevel, message: string, meta?: LogMeta): void {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...sanitizeMeta(meta),
  };

  const line =
    process.env.NODE_ENV === "production"
      ? JSON.stringify(entry)
      : `[${entry.timestamp}] ${level.toUpperCase()} ${message}${
          meta ? ` ${JSON.stringify(sanitizeMeta(meta))}` : ""
        }`;

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, meta?: LogMeta) => write("info", message, meta),
  warn: (message: string, meta?: LogMeta) => write("warn", message, meta),
  error: (message: string, meta?: LogMeta) => write("error", message, meta),
  debug: (message: string, meta?: LogMeta) => {
    if (process.env.NODE_ENV !== "production") write("debug", message, meta);
  },
  auth: (message: string, meta?: LogMeta) =>
    write("info", `[auth] ${message}`, meta),
  report: (message: string, meta?: LogMeta) =>
    write("info", `[report] ${message}`, meta),
};
