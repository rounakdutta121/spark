import { NextRequest } from "next/server";
import {
  errorResponse,
  successResponse,
} from "@/lib/api/response";
import { requireAdminUserId, adminErrorResponse } from "@/lib/api/require-admin";
import { listReports } from "@/services/admin/admin.service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUserId();
    const status = request.nextUrl.searchParams.get("status") as
      | "PENDING"
      | "REVIEWED"
      | "DISMISSED"
      | null;
    const reports = await listReports(status ?? undefined);
    return successResponse({ reports });
  } catch (error) {
    try {
      return adminErrorResponse(error);
    } catch {
      return errorResponse("Failed to load reports", 500);
    }
  }
}
