import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api/response";
import { requireAdminUserId, adminErrorResponse } from "@/lib/api/require-admin";
import { searchUsers } from "@/services/admin/admin.service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUserId();
    const q = request.nextUrl.searchParams.get("q") ?? undefined;
    const users = await searchUsers(q);
    return successResponse({ users });
  } catch (error) {
    try {
      return adminErrorResponse(error);
    } catch {
      return errorResponse("Failed to search users", 500);
    }
  }
}
