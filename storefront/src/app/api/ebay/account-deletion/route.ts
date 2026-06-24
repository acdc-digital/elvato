import crypto from "node:crypto"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const verificationToken = process.env.EBAY_ACCOUNT_DELETION_VERIFICATION_TOKEN
const endpointOverride = process.env.EBAY_ACCOUNT_DELETION_ENDPOINT_OVERRIDE

function endpointFor(request: NextRequest) {
  const url = new URL(request.url)
  url.search = ""
  return endpointOverride || url.toString()
}

export async function GET(request: NextRequest) {
  const challengeCode =
    request.nextUrl.searchParams.get("challenge_code") ||
    request.nextUrl.searchParams.get("challengeCode")

  if (!challengeCode) {
    return NextResponse.json({ error: "Missing challenge code" }, { status: 400 })
  }

  if (!verificationToken) {
    return NextResponse.json({ error: "Missing verification token" }, { status: 500 })
  }

  const challengeResponse = crypto
    .createHash("sha256")
    .update(challengeCode)
    .update(verificationToken)
    .update(endpointFor(request))
    .digest("hex")

  return NextResponse.json({ challengeResponse })
}

export async function POST() {
  // eBay sends marketplace account deletion/closure notifications here after
  // endpoint verification. Account data is not stored by Elvato today, so the
  // current compliant behavior is to acknowledge receipt successfully.
  return new Response(null, { status: 204 })
}