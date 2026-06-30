import {
  requireUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import { AdminError, requireAdmin } from "@/services/admin/admin.service";

export async function requireAdminUserId(): Promise<string> {
  const userId = await requireUserId();
  await requireAdmin(userId);
  return userId;
}

export function adminErrorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return unauthorizedResponse();
  if (error instanceof AdminError) {
    return Response.json(
      { success: false, error: error.message },
      { status: error.statusCode },
    );
  }
  throw error;
}
