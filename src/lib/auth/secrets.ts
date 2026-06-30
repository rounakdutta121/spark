function requireSecret(name: string, value: string | undefined): string {
  if (!value || value.length < 32) {
    throw new Error(
      `${name} must be set and at least 32 characters in production`,
    );
  }
  return value;
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    return requireSecret("JWT_SECRET", secret);
  }
  return secret ?? "dev-jwt-secret-change-in-production-min-32-chars";
}
