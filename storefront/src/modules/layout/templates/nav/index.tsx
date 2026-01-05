import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import SearchButton from "@modules/layout/components/search-button"
import { Button } from "@/components/ui/button"

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
          <div className="hidden small:flex items-center gap-x-2 h-full">
            <Button variant="link" asChild className="font-mono uppercase tracking-wider text-black">
              <div className="h-full flex items-center">
                <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
              </div>
            </Button>
            <Button variant="link" asChild className="font-mono uppercase tracking-wider text-black">
              <LocalizedClientLink
                href="/store"
                data-testid="nav-browse-link"
              >
                COLLECTIONS
              </LocalizedClientLink>
            </Button>
            <Button variant="link" asChild className="font-mono uppercase tracking-wider text-black">
              <LocalizedClientLink
                href="/about"
                data-testid="nav-about-link"
              >
                ABOUT US
              </LocalizedClientLink>
            </Button>
            <Button variant="link" asChild className="font-mono uppercase tracking-wider text-black">
              <LocalizedClientLink
                href="/how-it-works"
                data-testid="nav-how-link"
              >
                HOW IT WORKS
              </LocalizedClientLink>
            </Button>

            <Button variant="link" asChild className="font-mono uppercase tracking-wider text-black">
              <LocalizedClientLink
                href="/how-it-works"
                data-testid="nav-how-link"
              >
                TRADE
              </LocalizedClientLink>
            </Button>
          </div>

          {/* Right: Search, Account, Cart */}
          <div className="flex items-center gap-x-6 h-full">
            <div className="hidden small:flex items-center gap-x-2 h-full">
              <SearchButton />
              <Button variant="link" asChild className="font-mono uppercase tracking-wider text-black">
                <LocalizedClientLink
                  href="/account"
                  data-testid="nav-account-link"
                >
                  ACCOUNT
                </LocalizedClientLink>
              </Button>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="text-black hover:text-gray-400 transition-colors flex items-center gap-1"
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
