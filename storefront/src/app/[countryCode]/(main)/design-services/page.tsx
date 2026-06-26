import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Lighting Sourcing & Selection | Elvato",
  description:
    "Get help selecting or sourcing refined residential lighting from Elvato's curated catalogue and broader manufacturer network.",
}

export default function DesignServicesPage() {
  return (
    <div className="w-full bg-white">
      {/* Hero */}
      <div className="px-8 small:px-12 py-20 border-b border-black">
        <div className="max-w-3xl">
          <h1 className="text-4xl lg:text-6xl font-semibold leading-tight font-sans">
            Lighting sourcing & selection.
          </h1>
          <p className="mt-6 text-base lg:text-lg leading-relaxed font-sans text-gray-700">
            Elvato is not an interior design firm. We are lighting editors: a
            carefully curated catalogue, a broad manufacturer network, and
            knowledgeable support when you need help finding the right fixture.
          </p>
          <div className="flex flex-row gap-4 mt-10">
            <a
              href="mailto:hello@elvato.ca"
              className="inline-flex items-center justify-center px-9 py-4 bg-black text-white text-sm font-medium rounded-none border border-black transition-all duration-200 hover:bg-white hover:text-black"
            >
              ASK ABOUT SOURCING
            </a>
            <LocalizedClientLink
              href="/store"
              className="inline-flex items-center justify-center px-9 py-4 text-black text-sm font-medium rounded-none border border-black transition-all duration-200 hover:bg-[#373737] hover:text-white"
            >
              BROWSE THE EDIT
            </LocalizedClientLink>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="px-8 small:px-12 py-16 border-b border-black">
        <h2 className="text-2xl font-semibold font-sans mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="text-sm font-mono text-gray-400 mb-2">01</div>
            <h3 className="text-lg font-semibold font-sans mb-3">Tell us what you&apos;re looking for</h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              Share the room, scale, finish, style, budget, or reference image.
              A photo and a few preferences are often enough to begin.
            </p>
          </div>
          <div>
            <div className="text-sm font-mono text-gray-400 mb-2">02</div>
            <h3 className="text-lg font-semibold font-sans mb-3">We search the right places</h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              We start with our edited catalogue, then look across our manufacturer
              network when the right piece is not already online.
            </p>
          </div>
          <div>
            <div className="text-sm font-mono text-gray-400 mb-2">03</div>
            <h3 className="text-lg font-semibold font-sans mb-3">Compare and order with confidence</h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              We help you compare scale, finish, lead time, and fit, then support
              the order from inquiry through delivery.
            </p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="px-8 small:px-12 py-16 border-b border-black">
        <h2 className="text-2xl font-semibold font-sans mb-12">How we help</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-black p-8">
            <h3 className="text-lg font-semibold font-sans mb-3">Curated catalogue</h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              A tighter edit of residential lighting chosen for proportion,
              material, finish, and visual longevity.
            </p>
          </div>
          <div className="border border-black p-8">
            <h3 className="text-lg font-semibold font-sans mb-3">Manufacturer sourcing</h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              Access to lighting manufacturers beyond the website when you need
              a close match, a different finish, or a more specific silhouette.
            </p>
          </div>
          <div className="border border-black p-8">
            <h3 className="text-lg font-semibold font-sans mb-3">Fixture guidance</h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              Thoughtful help with size, placement intent, finish, brightness,
              and whether a piece belongs in the room you are building.
            </p>
          </div>
          <div className="border border-black p-8">
            <h3 className="text-lg font-semibold font-sans mb-3">White-glove support</h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              Clear communication from first question to delivery, with real
              people helping you make the right lighting decision.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-8 small:px-12 py-20 text-center">
        <h2 className="text-2xl lg:text-3xl font-semibold font-sans mb-4">
          Looking for something specific?
        </h2>
        <p className="text-sm font-sans text-gray-600 mb-8 max-w-xl mx-auto">
          Send us the room, style, finish, or reference fixture. We&apos;ll help you
          find a refined lighting option that fits.
        </p>
        <a
          href="mailto:hello@elvato.ca"
          className="inline-flex items-center justify-center px-9 py-4 bg-black text-white text-sm font-medium rounded-none border border-black transition-all duration-200 hover:bg-white hover:text-black"
        >
          REQUEST SOURCING HELP
        </a>
      </div>
    </div>
  )
}
