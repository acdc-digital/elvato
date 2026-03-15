import { Metadata } from "next"
import { Suspense } from "react"

import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { listRegions } from "@lib/data/regions"
import { getBaseURL } from "@lib/util/env"
import { StoreCartShippingOption, StoreRegion } from "@medusajs/types"
import AnnouncementBanner from "@modules/layout/components/announcement-banner"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

/**
 * Async component that fetches personalized cart/customer data and renders
 * banners. Wrapped in Suspense so the page shell streams immediately.
 */
async function PersonalizedBanners() {
  const [customer, cart] = await Promise.all([
    retrieveCustomer(),
    retrieveCart(),
  ])

  let shippingOptions: StoreCartShippingOption[] = []
  if (cart) {
    const { shipping_options } = await listCartOptions()
    shippingOptions = shipping_options
  }

  return (
    <>
      {customer && cart && (
        <CartMismatchBanner customer={customer} cart={cart} />
      )}
      {cart && (
        <FreeShippingPriceNudge
          variant="popup"
          cart={cart}
          shippingOptions={shippingOptions}
        />
      )}
    </>
  )
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  const regions: StoreRegion[] = await listRegions()

  return (
    <>
      <AnnouncementBanner regions={regions} />
      <Nav />
      <Suspense fallback={null}>
        <PersonalizedBanners />
      </Suspense>
      {props.children}
      <Footer />
    </>
  )
}
