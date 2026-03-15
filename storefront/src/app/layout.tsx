import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import Script from "next/script"
import { Fraunces } from "next/font/google"
import localFont from "next/font/local"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from '@vercel/analytics/next';
import "styles/globals.css"

const inclusiveSans = localFont({
  src: [
    {
      path: "../../public/fonts/InclusiveSans-VariableFont_wght.ttf",
      style: "normal",
    },
    {
      path: "../../public/fonts/InclusiveSans-Italic-VariableFont_wght.ttf",
      style: "italic",
    },
  ],
  variable: "--font-inclusive",
  display: "swap",
})

const fraunces = Fraunces({
  weight: "900",
  style: "italic",
  subsets: ["latin"],
  variable: "--font-fraunces",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "Elvato | Contemporary Lighting for Your Next Project",
    template: "%s | Elvato",
  },
  description:
    "Shop 803 published, affordable lighting designs — pendants, chandeliers, ceiling, wall, floor & table lamps, outdoor lighting, and smart controls.",
  openGraph: {
    siteName: "Elvato",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Elvato",
  url: getBaseURL(),
  logo: `${getBaseURL()}/brand/elvato-logo.png`,
}

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Elvato",
  url: getBaseURL(),
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${getBaseURL()}/us/store?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <head>
        {/* Preconnect to CDN origins so image/font requests skip DNS+TLS */}
        <link rel="preconnect" href="https://elvatoStorage-CDN.b-cdn.net" />
        <link rel="dns-prefetch" href="https://elvatoStorage-CDN.b-cdn.net" />
        <link rel="preconnect" href="https://cf.cjdropshipping.com" />
        <link rel="dns-prefetch" href="https://cf.cjdropshipping.com" />
      </head>
      <body className={`${inclusiveSans.variable} ${fraunces.variable} font-sans`}>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-V929297BMM"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-V929297BMM');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webSiteJsonLd),
          }}
        />
        <main className="relative">{props.children}</main>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
