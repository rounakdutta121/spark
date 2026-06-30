export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function sanitizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function sanitizeString(input: string): string {
  return input.trim();
}
