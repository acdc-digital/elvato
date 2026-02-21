import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Design Services | Elvato",
  description:
    "Work with our in-house lighting experts to specify, plan, and source the perfect fixtures for your residential or commercial project.",
}

export default function DesignServicesPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="border-b border-black bg-white">
        <div className="content-container py-20 md:py-28 flex flex-col items-center text-center gap-y-6 max-w-3xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-gray-500">
            For Designers, Architects & Homeowners
          </span>
          <h1 className="text-4xl md:text-6xl font-semibold leading-tight font-sans">
            Lighting design services
          </h1>
          <p className="text-base md:text-lg font-mono text-gray-700 leading-relaxed max-w-xl">
            From concept to installation — our team helps you find the right
            fixtures, create lighting plans, and deliver project-ready
            specifications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <LocalizedClientLink
              href="/contact"
              className="inline-flex items-center justify-center px-9 py-4 bg-black text-white text-sm font-medium border border-black transition-all duration-200 hover:bg-white hover:text-black"
            >
              GET A FREE CONSULTATION
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/store"
              className="inline-flex items-center justify-center px-9 py-4 text-black text-sm font-medium border border-black transition-all duration-200 hover:bg-black hover:text-white"
            >
              BROWSE CATALOGUE
            </LocalizedClientLink>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b border-black bg-white">
        <div className="content-container py-16 md:py-20">
          <h2 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-10 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                step: "01",
                title: "Share Your Vision",
                description:
                  "Tell us about your space, style preferences, and budget. Attach floor plans or inspiration images if you have them.",
              },
              {
                step: "02",
                title: "Receive a Lighting Plan",
                description:
                  "Our team curates a selection of fixtures tailored to your project, complete with specifications and placement recommendations.",
              },
              {
                step: "03",
                title: "Review & Order",
                description:
                  "Approve the plan, make adjustments, then order directly through Elvato with trade pricing and dedicated support.",
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col gap-y-4">
                <span className="text-3xl font-semibold font-sans text-black">
                  {item.step}
                </span>
                <h3 className="text-lg font-semibold font-sans">{item.title}</h3>
                <p className="text-sm font-mono text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="border-b border-black bg-white">
        <div className="content-container py-16 md:py-20">
          <h2 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-10 text-center">
            What We Offer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Residential Projects",
                description:
                  "Whole-home lighting packages for new builds, renovations, and room refreshes. We help homeowners make confident decisions on every fixture.",
              },
              {
                title: "Commercial & Hospitality",
                description:
                  "Specification-grade selections for restaurants, hotels, offices, and retail. Submittal sheets and cut-sheets available for every product.",
              },
              {
                title: "Lighting Controls",
                description:
                  "Smart dimming, scene management, and automation integration. We pair the right controls with your fixtures for a seamless experience.",
              },
              {
                title: "Trade Program",
                description:
                  "Exclusive pricing, priority support, and dedicated account management for interior designers, architects, and contractors.",
              },
            ].map((service) => (
              <div
                key={service.title}
                className="border border-black p-8 flex flex-col gap-y-3"
              >
                <h3 className="text-lg font-semibold font-sans">
                  {service.title}
                </h3>
                <p className="text-sm font-mono text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white">
        <div className="content-container py-16 md:py-20 flex flex-col items-center text-center gap-y-6 max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-semibold font-sans leading-tight">
            Ready to start your project?
          </h2>
          <p className="text-sm font-mono text-gray-600 leading-relaxed">
            Whether you&apos;re a homeowner planning a renovation or an architect
            specifying fixtures for a build — we&apos;re here to help.
          </p>
          <LocalizedClientLink
            href="/contact"
            className="inline-flex items-center justify-center px-9 py-4 bg-black text-white text-sm font-medium border border-black transition-all duration-200 hover:bg-white hover:text-black mt-2"
          >
            CONTACT OUR TEAM
          </LocalizedClientLink>
        </div>
      </section>
    </div>
  )
}
