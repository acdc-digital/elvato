import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | Elvato",
  description: "Elvato privacy policy for customers and marketplace users.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 small:px-8">
      <h1 className="text-3xl font-semibold text-ui-fg-base">Privacy Policy</h1>
      <p className="mt-3 text-sm text-ui-fg-subtle">Last updated: June 22, 2026</p>

      <div className="mt-8 space-y-8 text-base leading-7 text-ui-fg-base">
        <section>
          <h2 className="text-xl font-semibold">Overview</h2>
          <p className="mt-3">
            Elvato uses customer and marketplace information to operate our
            lighting storefront, process orders, provide support, manage
            shipping, prevent fraud, and meet legal obligations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Information We Collect</h2>
          <p className="mt-3">
            We may collect contact information, shipping and billing details,
            order history, marketplace identifiers, support messages, and basic
            technical information such as device, browser, and analytics data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">How We Use Information</h2>
          <p className="mt-3">
            We use information to fulfill purchases, communicate about orders,
            improve the shopping experience, reconcile marketplace activity,
            maintain business records, comply with marketplace policies, and
            protect customers and Elvato from misuse.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Sharing</h2>
          <p className="mt-3">
            We share information only with service providers needed to run the
            business, including payment processors, commerce platforms,
            shipping providers, analytics providers, marketplace platforms, and
            legal or compliance partners when required.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Marketplace Account Deletion</h2>
          <p className="mt-3">
            When a marketplace such as eBay notifies Elvato that a user has
            requested account deletion, Elvato will delete or de-identify
            marketplace user data unless retention is required for legal,
            tax, fraud-prevention, chargeback, or compliance reasons.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="mt-3">
            Privacy requests can be sent to support@elvato.shop.
          </p>
        </section>
      </div>
    </div>
  )
}