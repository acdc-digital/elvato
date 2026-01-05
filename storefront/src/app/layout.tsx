import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
// import { Rubik_Wet_Paint } from "next/font/google"
import "styles/globals.css"

// const rubikWetPaint = Rubik_Wet_Paint({
//   weight: "400",
//   subsets: ["latin"],
//   variable: "--font-rubik-wet-paint",
// })

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
