import { errorResponse, successResponse } from "@/lib/api/response";
import {
  requireUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import { clearAuthCookiesOnResponse } from "@/lib/api/response";
import { logoutAllDevices } from "@/services/account/account.service";

export async function POST() {
  try {
    const userId = await requireUserId();
    await logoutAllDevices(userId);
    const response = successResponse({ message: "Logged out of all devices" });
    return clearAuthCookiesOnResponse(response);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    return errorResponse("Failed to logout all devices", 500);
  }
}
