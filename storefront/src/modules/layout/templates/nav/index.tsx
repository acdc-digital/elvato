import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import SearchButton from "@modules/layout/components/search-button"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-24 mx-auto border-b border-black duration-200 bg-white">
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full h-full text-small-regular">
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-x-4 h-full">
            <div className="h-full">
              <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
            </div>
            <LocalizedClientLink
              href="/"
              className="flex items-center"
              data-testid="nav-logo-link"
            >
              <img 
                src="//brandlesse.com/cdn/shop/files/Favicon_HD_White.png?v=1763590593&width=200" 
                alt="Logo"
                className="w-8 h-8 small:w-10 small:h-10"
              />
            </LocalizedClientLink>
          </div>

          {/* Center: Navigation Links */}
          <div className="hidden small:flex items-center gap-x-8 h-full">
            <LocalizedClientLink
              href="/"
              className="text-sm uppercase tracking-wider hover:text-ui-fg-base transition-colors"
              data-testid="nav-home-link"
            >
              Home
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/store"
              className="text-sm uppercase tracking-wider hover:text-ui-fg-base transition-colors"
              data-testid="nav-browse-link"
            >
              Browse Domains
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/about"
              className="text-sm uppercase tracking-wider hover:text-ui-fg-base transition-colors"
              data-testid="nav-about-link"
            >
              About Us
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/how-it-works"
              className="text-sm uppercase tracking-wider hover:text-ui-fg-base transition-colors"
              data-testid="nav-how-link"
            >
              How it Works
            </LocalizedClientLink>
          </div>

          {/* Right: Search, Account, Cart */}
          <div className="flex items-center gap-x-6 h-full">
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <SearchButton />
              <LocalizedClientLink
                className="hover:text-ui-fg-base"
                href="/account"
                data-testid="nav-account-link"
              >
                Account
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base flex items-center gap-1"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  <svg 
                    className="w-5 h-5" 
                    viewBox="0 0 64 64" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3"
                  >
                    <path d="M11.375 17.863h41.25v36.75h-41.25z" />
                    <path d="M22.25 18c0-7.105 4.35-9 9.75-9s9.75 1.895 9.75 9" />
                  </svg>
                  <span className="text-sm">(0)</span>
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
