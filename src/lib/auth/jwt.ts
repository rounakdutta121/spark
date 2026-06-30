import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_EXPIRY } from "@/lib/auth/constants";
import { getJwtSecret } from "@/lib/auth/secrets";
import type { AccessTokenPayload } from "@/types/auth";

export function signAccessToken(
  userId: string,
  sessionId: string,
): string {
  const payload: AccessTokenPayload = {
    sub: userId,
    sessionId,
    type: "access",
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret()) as AccessTokenPayload;

  if (decoded.type !== "access") {
    throw new Error("Invalid token type");
  }

  return decoded;
}
