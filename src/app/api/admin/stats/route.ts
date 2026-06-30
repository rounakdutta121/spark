import { errorResponse, successResponse } from "@/lib/api/response";
import { requireAdminUserId, adminErrorResponse } from "@/lib/api/require-admin";
import { getAdminStats } from "@/services/admin/admin.service";

export async function GET() {
  try {
    await requireAdminUserId();
    const stats = await getAdminStats();
    return successResponse({ stats });
  } catch (error) {
    try {
      return adminErrorResponse(error);
    } catch {
      console.error("Admin stats error:", error);
      return errorResponse("Failed to load stats", 500);
    }
  }
}
