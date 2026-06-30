import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import { requireAdminUserId, adminErrorResponse } from "@/lib/api/require-admin";
import { adminBanSchema } from "@/lib/schemas/moderation.schema";
import {
  deleteUserAccount,
  setUserActive,
} from "@/services/admin/admin.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminUserId();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adminBanSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const user = await setUserActive(id, parsed.data.isActive);
    return successResponse({ user });
  } catch (error) {
    try {
      return adminErrorResponse(error);
    } catch {
      return errorResponse("Failed to update user", 500);
    }
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdminUserId();
    const { id } = await context.params;
    await deleteUserAccount(id);
    return successResponse({ deleted: true });
  } catch (error) {
    try {
      return adminErrorResponse(error);
    } catch {
      return errorResponse("Failed to delete user", 500);
    }
  }
}
