import { errorResponse } from "@/lib/api/response";
import {
  assertEmailVerified,
  EmailNotVerifiedError,
  AccountSuspendedError,
} from "@/lib/api/require-verified";

export async function gateVerifiedUser(userId: string) {
  try {
    await assertEmailVerified(userId);
  } catch (error) {
    if (error instanceof EmailNotVerifiedError) {
      return errorResponse(
        "Please verify your email to use this feature",
        403,
        "EMAIL_NOT_VERIFIED",
      );
    }
    if (error instanceof AccountSuspendedError) {
      return errorResponse("Account suspended", 403, "ACCOUNT_SUSPENDED");
    }
    throw error;
  }
  return null;
}
