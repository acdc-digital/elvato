import { Metadata } from "next"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "How It Works | Elvato",
  description:
    "Discover how Elvato makes contemporary lighting accessible — from our curated selection process to expert design support, ordering, and delivery.",
}

export default function HowItWorksPage() {
  return (
    <div className="w-full bg-white">
      {/* Hero */}
      <div className="px-8 small:px-12 py-20 small:py-28 border-b border-black">
        <div className="max-w-3xl">
          <h1 className="text-4xl lg:text-6xl font-semibold leading-tight font-sans">
            How it works.
          </h1>
          <p className="mt-6 text-base lg:text-lg leading-relaxed font-sans text-gray-700 max-w-2xl">
            From discovery to delivery, we&apos;ve designed every step to be
            straightforward. Browse a curated selection, get expert guidance when
            you need it, and receive fixtures that transform your space.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="px-8 small:px-12 py-16 border-b border-black">
        <h2 className="text-2xl font-semibold font-sans mb-12">The process</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="text-sm font-mono text-gray-400 mb-2">01</div>
            <h3 className="text-lg font-semibold font-sans mb-3">Browse</h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              Explore our collection of contemporary fixtures — pendants,
              chandeliers, wall sconces, table lamps, outdoor lighting, and smart
              controls. Every piece has been hand-selected for design merit and
              quality.
            </p>
          </div>
          <div>
            <div className="text-sm font-mono text-gray-400 mb-2">02</div>
            <h3 className="text-lg font-semibold font-sans mb-3">Specify</h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              Need help choosing? Our team provides submittal sheets,
              specification documents, and professional lighting consultation for
              projects of any scale — from a single room to an entire building.
            </p>
          </div>
          <div>
            <div className="text-sm font-mono text-gray-400 mb-2">03</div>
            <h3 className="text-lg font-semibold font-sans mb-3">Order</h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              Place your order with confidence. Free shipping on orders over
              $1,500, a 30-day satisfaction guarantee, and a dedicated support
              team behind every purchase.
            </p>
          </div>
          <div>
            <div className="text-sm font-mono text-gray-400 mb-2">04</div>
            <h3 className="text-lg font-semibold font-sans mb-3">Install</h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              Receive your fixtures carefully packaged and ready to install. Every
              product ships with full documentation, and our team is available for
              post-purchase support.
            </p>
          </div>
        </div>
      </div>

      {/* Lifestyle Image */}
      <div className="w-full border-b border-black">
        <div className="relative w-full h-[320px] small:h-[480px] lg:h-[560px]">
          <Image
            src="/byRoom/storefront-kitchen 1.png"
            alt="A modern kitchen with contemporary pendant lighting"
            fill
            className="object-cover"
            sizes="100vw"
            priority={false}
          />
        </div>
      </div>

      {/* What sets us apart */}
      <div className="px-8 small:px-12 py-16 border-b border-black">
        <h2 className="text-2xl font-semibold font-sans mb-12">
          What sets us apart
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-black p-8">
            <h3 className="text-lg font-semibold font-sans mb-3">
              Curated selection
            </h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              We don&apos;t carry everything — we carry the right things. Every
              fixture is evaluated for design integrity, build quality, and how it
              serves the space it&apos;s meant for.
            </p>
          </div>
          <div className="border border-black p-8">
            <h3 className="text-lg font-semibold font-sans mb-3">
              Submittal sheets
            </h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              Professional specification documents available for every product.
              Share with your contractor, designer, or architect to ensure the
              right fit before you order.
            </p>
          </div>
          <div className="border border-black p-8">
            <h3 className="text-lg font-semibold font-sans mb-3">
              Expert support
            </h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              Whether you need help with colour temperature, dimming
              compatibility, or choosing the right fixture for your ceiling
              height — we&apos;re here to help.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-8 small:px-12 py-20 text-center">
        <h2 className="text-2xl lg:text-3xl font-semibold font-sans mb-4">
          Ready to get started?
        </h2>
        <p className="text-sm font-sans text-gray-600 mb-8 max-w-xl mx-auto">
          Browse our collection or reach out for personalized lighting
          guidance on your next project.
        </p>
        <div className="flex flex-col small:flex-row items-center justify-center gap-4">
          <LocalizedClientLink
            href="/store"
            className="inline-flex items-center justify-center px-9 py-4 bg-black text-white text-sm font-medium rounded-none border border-black transition-all duration-200 hover:bg-white hover:text-black"
          >
            SHOP NOW
          </LocalizedClientLink>
          <a
            href="mailto:hello@elvato.ca"
            className="inline-flex items-center justify-center px-9 py-4 text-black text-sm font-medium rounded-none border border-black transition-all duration-200 hover:bg-[#373737] hover:text-white"
          >
            CONTACT US
          </a>
        </div>
      </div>
    </div>
  )
}
