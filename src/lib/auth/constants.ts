export const AUTH_COOKIES = {
  accessToken: "spark_access_token",
  refreshToken: "spark_refresh_token",
} as const;

export const ACCESS_TOKEN_EXPIRY = "15m";
export const REFRESH_TOKEN_EXPIRY_REMEMBER = 30; // days
export const REFRESH_TOKEN_EXPIRY_SESSION = 1; // day

export const BCRYPT_ROUNDS = 12;

export const RATE_LIMIT = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
} as const;
