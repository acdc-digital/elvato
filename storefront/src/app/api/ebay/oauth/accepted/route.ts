import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const expiresIn = request.nextUrl.searchParams.get("expires_in")

  return Response.json({
    status: code ? "accepted" : "ready",
    provider: "ebay",
    hasCode: Boolean(code),
    expiresIn,
  })
}