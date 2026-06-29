import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const dynamic = "force-static"

export async function GET() {
  const icon = await readFile(join(process.cwd(), "src/app/icon.svg"), "utf8")

  return new Response(icon, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}