import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Design Services | Elvato",
  description:
    "Expert lighting design services for residential and commercial projects. Get personalized lighting plans, submittal sheets, and professional consultation.",
}

export default function DesignServicesPage() {
  return (
    <div className="w-full bg-white">
      {/* Hero */}
      <div className="px-8 small:px-12 py-20 border-b border-black">
        <div className="max-w-3xl">
          <h1 className="text-4xl lg:text-6xl font-semibold leading-tight font-sans">
            Lighting design services.
          </h1>
          <p className="mt-6 text-base lg:text-lg leading-relaxed font-sans text-gray-700">
            Whether you&apos;re designing a single room or an entire building, our team
            provides expert specification and design services tailored to your
            project requirements.
          </p>
          <div className="flex flex-row gap-4 mt-10">
            <a
              href="mailto:hello@elvato.ca"
              className="inline-flex items-center justify-center px-9 py-4 bg-black text-white text-sm font-medium rounded-none border border-black transition-all duration-200 hover:bg-white hover:text-black"
            >
              CONTACT US
            </a>
            <LocalizedClientLink
              href="/store"
              className="inline-flex items-center justify-center px-9 py-4 text-black text-sm font-medium rounded-none border border-black transition-all duration-200 hover:bg-[#373737] hover:text-white"
            >
              BROWSE PRODUCTS
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
            <h3 className="text-lg font-semibold font-sans mb-3">Share your vision</h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              Tell us about your project — room dimensions, style preferences,
              and functional requirements. Share photos, floor plans, or mood boards.
            </p>
          </div>
          <div>
            <div className="text-sm font-mono text-gray-400 mb-2">02</div>
            <h3 className="text-lg font-semibold font-sans mb-3">Receive your plan</h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              Our lighting specialists will curate a personalized selection of fixtures
              and controls, complete with submittal sheets and specification documents.
            </p>
          </div>
          <div>
            <div className="text-sm font-mono text-gray-400 mb-2">03</div>
            <h3 className="text-lg font-semibold font-sans mb-3">Review & order</h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              Review the recommendations with your team, request adjustments,
              and place your order with confidence. We handle the rest.
            </p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="px-8 small:px-12 py-16 border-b border-black">
        <h2 className="text-2xl font-semibold font-sans mb-12">Our services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-black p-8">
            <h3 className="text-lg font-semibold font-sans mb-3">Residential</h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              Complete lighting plans for homes, condos, and renovations.
              From single-room refreshes to full-home lighting design.
            </p>
          </div>
          <div className="border border-black p-8">
            <h3 className="text-lg font-semibold font-sans mb-3">Commercial & Hospitality</h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              Specification services for restaurants, hotels, offices, and retail spaces.
              Volume pricing and project coordination included.
            </p>
          </div>
          <div className="border border-black p-8">
            <h3 className="text-lg font-semibold font-sans mb-3">Lighting Controls</h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              Smart dimming systems, scene controllers, and whole-home automation.
              Compatible with major home automation platforms.
            </p>
          </div>
          <div className="border border-black p-8">
            <h3 className="text-lg font-semibold font-sans mb-3">Trade Program</h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              Dedicated support for designers, architects, and contractors.
              Trade pricing, priority ordering, and dedicated account management.
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
          Reach out to our team and we&apos;ll help you find the perfect lighting
          solution for your project.
        </p>
        <a
          href="mailto:hello@elvato.ca"
          className="inline-flex items-center justify-center px-9 py-4 bg-black text-white text-sm font-medium rounded-none border border-black transition-all duration-200 hover:bg-white hover:text-black"
        >
          GET IN TOUCH
        </a>
      </div>
    </div>
  )
}
