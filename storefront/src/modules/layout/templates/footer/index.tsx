import { listCollections } from "@lib/data/collections"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function Footer() {
  const { collections } = await listCollections({
    fields: "*products",
  })

  return (
    <footer className="border-t border-black w-full bg-white">
      <div className="px-8 small:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand */}
          <div className="md:col-span-3">
            <LocalizedClientLink href="/" className="inline-block">
              <span className="text-2xl italic" style={{ fontFamily: 'var(--font-fraunces)' }}>
                Elvato
              </span>
            </LocalizedClientLink>
            <p className="mt-3 text-sm font-mono text-gray-600 leading-relaxed">
              Contemporary lighting &<br />controls for your next project.
            </p>
          </div>

          {/* Shop */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-sans uppercase tracking-widest font-semibold mb-4">
              Shop
            </h4>
            <ul className="space-y-2">
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
                  className="text-sm font-mono text-gray-600 hover:text-black transition-colors"
                >
                  View All
                </LocalizedClientLink>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-sans uppercase tracking-widest font-semibold mb-4">
              Company
            </h4>
            <ul className="space-y-2">
              <li>
                <LocalizedClientLink href="/about" className="text-sm font-mono text-gray-600 hover:text-black transition-colors">
                  About Us
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/how-it-works" className="text-sm font-mono text-gray-600 hover:text-black transition-colors">
                  How It Works
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/store" className="text-sm font-mono text-gray-600 hover:text-black transition-colors">
                  Collections
                </LocalizedClientLink>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-sans uppercase tracking-widest font-semibold mb-4">
              Support
            </h4>
            <ul className="space-y-2">
              <li>
                <LocalizedClientLink href="/contact" className="text-sm font-mono text-gray-600 hover:text-black transition-colors">
                  Contact Us
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/shipping-returns" className="text-sm font-mono text-gray-600 hover:text-black transition-colors">
                  Shipping & Returns
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/faq" className="text-sm font-mono text-gray-600 hover:text-black transition-colors">
                  FAQ
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/privacy" className="text-sm font-mono text-gray-600 hover:text-black transition-colors">
                  Privacy Policy
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/terms" className="text-sm font-mono text-gray-600 hover:text-black transition-colors">
                  Terms of Service
                </LocalizedClientLink>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="md:col-span-3">
            <h4 className="text-sm font-sans uppercase tracking-widest font-semibold mb-4">
              Account
            </h4>
            <ul className="space-y-2">
              <li>
                <LocalizedClientLink href="/account" className="text-sm font-mono text-gray-600 hover:text-black transition-colors">
                  My Account
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/account/orders" className="text-sm font-mono text-gray-600 hover:text-black transition-colors">
                  Orders
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/cart" className="text-sm font-mono text-gray-600 hover:text-black transition-colors">
                  Cart
                </LocalizedClientLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-mono text-gray-500">
            © {new Date().getFullYear()} Elvato. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
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
