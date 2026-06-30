import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: "healthy",
      app: "Spark",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
    },
  });
}
