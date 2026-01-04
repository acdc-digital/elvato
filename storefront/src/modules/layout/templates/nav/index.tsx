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
      <header className="relative h-24 mx-auto border-b border-black duration-200" style={{ background: 'linear-gradient(to bottom right, #f8f8f8, #ffffff)' }}>
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full h-full text-small-regular">
          {/* Left: Logo */}
          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="flex items-center"
              data-testid="nav-logo-link"
            >
              <img 
                src="/Elvato.svg" 
                alt="Elvato"
                className="h-10 w-auto small:h-12"
              />
            </LocalizedClientLink>
          </div>

          {/* Center: Navigation Links */}
          <div className="hidden small:flex items-center gap-x-8 h-full">
            <div className="h-full">
              <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
            </div>
            <LocalizedClientLink
              href="/store"
              className="text-sm uppercase tracking-wider hover:text-ui-fg-base transition-colors font-mono"
              data-testid="nav-browse-link"
            >
              BROWSE DOMAINS
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/about"
              className="text-sm uppercase tracking-wider hover:text-ui-fg-base transition-colors font-mono"
              data-testid="nav-about-link"
            >
              ABOUT US
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/how-it-works"
              className="text-sm uppercase tracking-wider hover:text-ui-fg-base transition-colors font-mono"
              data-testid="nav-how-link"
            >
              HOW IT WORKS
            </LocalizedClientLink>
          </div>

          {/* Right: Search, Account, Cart */}
          <div className="flex items-center gap-x-6 h-full">
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <SearchButton />
              <LocalizedClientLink
                className="hover:text-ui-fg-base text-sm uppercase tracking-wider font-mono"
                href="/account"
                data-testid="nav-account-link"
              >
                ACCOUNT
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
                    className="w-6 h-6" 
                    viewBox="0 0 64 64" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3"
                  >
                    <path d="M11.375 17.863h41.25v36.75h-41.25z" />
                    <path d="M22.25 18c0-7.105 4.35-9 9.75-9s9.75 1.895 9.75 9" />
                  </svg>
                  <span className="text-base font-mono">(0)</span>
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
