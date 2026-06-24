import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  return Response.json({
    status: "declined",
    provider: "ebay",
    error: request.nextUrl.searchParams.get("error"),
    errorDescription: request.nextUrl.searchParams.get("error_description"),
  })
}