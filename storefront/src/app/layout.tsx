import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Fraunces } from "next/font/google"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "styles/globals.css"

const fraunces = Fraunces({
  weight: "900",
  style: "italic",
  subsets: ["latin"],
  variable: "--font-fraunces",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body className={fraunces.variable}>
        <main className="relative">{props.children}</main>
        <SpeedInsights />
      </body>
    </html>
  )
}
