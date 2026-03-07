import { Metadata } from "next"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "About | Elvato",
  description:
    "Elvato is a contemporary lighting retailer built on a decade of supply chain expertise and a genuine passion for how light shapes spaces. Curated designs from top manufacturers worldwide.",
}

export default function AboutPage() {
  return (
    <div className="w-full bg-white">
      {/* Hero */}
      <div className="px-8 small:px-12 py-20 small:py-28 border-b border-black">
        <div className="max-w-3xl">
          <h1 className="text-4xl lg:text-6xl font-semibold leading-tight font-sans">
            Contemporary lighting, thoughtfully curated.
          </h1>
          <p className="mt-6 text-base lg:text-lg leading-relaxed font-sans text-gray-700 max-w-2xl">
            Elvato is built on a simple belief: the right light changes everything.
            Founded on over a decade of supply chain expertise in the lighting
            industry, we hand-select every fixture in our collection for its design
            merit, its craft, and the way it makes a space feel.
          </p>
          <p className="mt-4 text-base lg:text-lg leading-relaxed font-sans text-gray-700 max-w-2xl">
            We work directly with manufacturers and designers around the world to
            bring contemporary lighting to projects of every scale — from a single
            room to an entire building.
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="px-8 small:px-12 py-16 border-b border-black">
        <h2 className="text-2xl font-semibold font-sans mb-12">What we believe</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-black p-8">
            <h3 className="text-lg font-semibold font-sans mb-3">
              Curated, not collected
            </h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              Every fixture in our catalogue is hand-selected for its design integrity.
              We don&apos;t aggregate bulk inventories — we choose pieces that reflect
              a clear point of view on contemporary lighting and how it serves the
              spaces it inhabits.
            </p>
          </div>
          <div className="border border-black p-8">
            <h3 className="text-lg font-semibold font-sans mb-3">
              Design meets engineering
            </h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              Light is both technical and emotional. We care as much about colour
              temperature, beam angles, and dimming compatibility as we do about
              form, finish, and the feeling a fixture brings to a room. That
              intersection is where great lighting lives.
            </p>
          </div>
          <div className="border border-black p-8">
            <h3 className="text-lg font-semibold font-sans mb-3">
              Expert guidance
            </h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              We&apos;re not just a store — we&apos;re a resource. Our team provides
              specification services, submittal sheets, and professional consultation
              for residential and commercial projects alike. The right light for your
              project is a conversation, not a guess.
            </p>
          </div>
          <div className="border border-black p-8">
            <h3 className="text-lg font-semibold font-sans mb-3">
              Supply chain excellence
            </h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              Behind every order is over a decade of logistics expertise — reliable
              sourcing, quality assurance, and fulfilment you can count on. We
              celebrate the designers and manufacturers who create these fixtures,
              and we make sure their work reaches you exactly as intended.
            </p>
          </div>
        </div>
      </div>

      {/* Lifestyle Image */}
      <div className="w-full border-b border-black">
        <div className="relative w-full h-[320px] small:h-[480px] lg:h-[560px]">
          <Image
            src="/byRoom/storefront-dining 1.png"
            alt="A contemporary dining space illuminated by a curated pendant light"
            fill
            className="object-cover"
            sizes="100vw"
            priority={false}
          />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-8 small:px-12 py-20 text-center">
        <h2 className="text-2xl lg:text-3xl font-semibold font-sans mb-4">
          Let&apos;s light your next project.
        </h2>
        <p className="text-sm font-sans text-gray-600 mb-8 max-w-xl mx-auto">
          Browse our curated collection or connect with our team for expert
          guidance on your residential or commercial project.
        </p>
        <div className="flex flex-col small:flex-row items-center justify-center gap-4">
          <LocalizedClientLink
            href="/store"
            className="inline-flex items-center justify-center px-9 py-4 bg-black text-white text-sm font-medium rounded-none border border-black transition-all duration-200 hover:bg-white hover:text-black"
          >
            BROWSE COLLECTION
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/design-services"
            className="inline-flex items-center justify-center px-9 py-4 text-black text-sm font-medium rounded-none border border-black transition-all duration-200 hover:bg-[#373737] hover:text-white"
          >
            DESIGN SERVICES
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
