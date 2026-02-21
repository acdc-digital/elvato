import { listCollections } from "@lib/data/collections"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function Footer() {
  const { collections } = await listCollections({
    fields: "id,handle,title",
  })

  return (
    <footer className="border-t border-black w-full bg-white">
      <div className="content-container flex flex-col w-full">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-y-10 md:gap-x-8 py-16 md:py-20">
          {/* Brand column */}
          <div className="md:col-span-4 flex flex-col gap-y-6">
            <LocalizedClientLink href="/" className="inline-block">
              <span
                className="text-4xl font-black italic text-black"
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                Elvato.
              </span>
            </LocalizedClientLink>
            <p className="text-sm font-mono text-gray-600 leading-relaxed max-w-xs">
              A curated collection of 820+ affordable, handpicked lighting
              designs sourced from top manufacturers around the world.
            </p>
          </div>

          {/* Shop column */}
          <div className="md:col-span-2 flex flex-col gap-y-4">
            <span className="text-sm font-sans uppercase tracking-widest text-black font-semibold">
              Shop
            </span>
            <ul className="flex flex-col gap-y-2.5">
              {collections?.slice(0, 8).map((c) => (
                <li key={c.id}>
                  <LocalizedClientLink
                    href={`/collections/${c.handle}`}
                    className="text-sm font-mono text-gray-600 hover:text-black transition-colors"
                  >
                    {c.title}
                  </LocalizedClientLink>
                </li>
              ))}
              <li>
                <LocalizedClientLink
                  href="/store"
                  className="text-sm font-mono text-black underline underline-offset-2 hover:no-underline transition-colors"
                >
                  View All
                </LocalizedClientLink>
              </li>
            </ul>
          </div>

          {/* Company column */}
          <div className="md:col-span-2 flex flex-col gap-y-4">
            <span className="text-sm font-sans uppercase tracking-widest text-black font-semibold">
              Company
            </span>
            <ul className="flex flex-col gap-y-2.5">
              <li>
                <LocalizedClientLink
                  href="/about"
                  className="text-sm font-mono text-gray-600 hover:text-black transition-colors"
                >
                  About Us
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/how-it-works"
                  className="text-sm font-mono text-gray-600 hover:text-black transition-colors"
                >
                  How It Works
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/store"
                  className="text-sm font-mono text-gray-600 hover:text-black transition-colors"
                >
                  Collections
                </LocalizedClientLink>
              </li>
            </ul>
          </div>

          {/* Support column */}
          <div className="md:col-span-2 flex flex-col gap-y-4">
            <span className="text-sm font-sans uppercase tracking-widest text-black font-semibold">
              Support
            </span>
            <ul className="flex flex-col gap-y-2.5">
              <li>
                <LocalizedClientLink
                  href="/contact"
                  className="text-sm font-mono text-gray-600 hover:text-black transition-colors"
                >
                  Contact Us
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/shipping"
                  className="text-sm font-mono text-gray-600 hover:text-black transition-colors"
                >
                  Shipping & Returns
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/faq"
                  className="text-sm font-mono text-gray-600 hover:text-black transition-colors"
                >
                  FAQ
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/privacy"
                  className="text-sm font-mono text-gray-600 hover:text-black transition-colors"
                >
                  Privacy Policy
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/terms"
                  className="text-sm font-mono text-gray-600 hover:text-black transition-colors"
                >
                  Terms of Service
                </LocalizedClientLink>
              </li>
            </ul>
          </div>

          {/* Account column */}
          <div className="md:col-span-2 flex flex-col gap-y-4">
            <span className="text-sm font-sans uppercase tracking-widest text-black font-semibold">
              Account
            </span>
            <ul className="flex flex-col gap-y-2.5">
              <li>
                <LocalizedClientLink
                  href="/account"
                  className="text-sm font-mono text-gray-600 hover:text-black transition-colors"
                >
                  My Account
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/account/orders"
                  className="text-sm font-mono text-gray-600 hover:text-black transition-colors"
                >
                  Order History
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/cart"
                  className="text-sm font-mono text-gray-600 hover:text-black transition-colors"
                >
                  Cart
                </LocalizedClientLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-black py-6 flex flex-col sm:flex-row items-center justify-between gap-y-2">
          <span className="text-xs font-mono text-gray-500">
            © {new Date().getFullYear()} Elvato. All rights reserved.
          </span>
          <div className="flex items-center gap-x-4">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-gray-500 hover:text-black transition-colors uppercase tracking-wider"
            >
              Instagram
            </a>
            <a
              href="https://pinterest.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-gray-500 hover:text-black transition-colors uppercase tracking-wider"
            >
              Pinterest
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
