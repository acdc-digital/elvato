import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SecondaryHero = () => {
  return (
    <div className="w-full overflow-hidden min-h-[50vh] lg:h-[50vh]">
      <div className="grid grid-cols-1 lg:grid-cols-2 relative h-full">
        
        {/* Left Panel - Image */}
        <div className="relative bg-white order-2 lg:order-1">
          {/* Grid of squares at the top */}
          <div className="grid grid-cols-5 lg:w-[95%] border-t border-black">
            {[...Array(5)].map((_, i) => (
              <LocalizedClientLink
                key={i}
                href="#"
                className="aspect-square bg-gray-200 border-b border-r border-black overflow-hidden relative block"
              >
                <div className="absolute top-0 left-0 bg-black text-white px-2.5 py-1 text-xs font-sans uppercase z-10">
                  Featured
                </div>
                {i === 0 && (
                  <Image
                    src="/controls/controls-1v3.png"
                    alt="Featured"
                    fill
                    sizes="10vw"
                    className="object-cover"
                  />
                )}
                {i === 1 && (
                  <Image
                    src="/controls/controls-2.png"
                    alt="Featured"
                    fill
                    sizes="10vw"
                    className="object-cover"
                  />
                )}
                {i === 2 && (
                  <Image
                    src="/controls/controls-3v2.png"
                    alt="Featured"
                    fill
                    sizes="10vw"
                    className="object-cover"
                  />
                )}
                {i === 3 && (
                  <Image
                    src="/controls/controls-4.png"
                    alt="Featured"
                    fill
                    sizes="10vw"
                    className="object-cover"
                  />
                )}
                {i === 4 && (
                  <Image
                    src="/controls/controls-5.png"
                    alt="Featured"
                    fill
                    sizes="10vw"
                    className="object-cover"
                  />
                )}
              </LocalizedClientLink>
            ))}
          </div>
          
          <div className="overflow-hidden lg:w-[96%] flex-1">
            <img 
              src="/controls/controls-hero-2.svg"
              alt="Lutron lighting controls installation"
              loading="lazy"
              className="w-full h-full object-cover"
              style={{ objectPosition: '20% center' }}
            />
          </div>
        </div>

        {/* Right Panel - Content */}
        <div className="flex flex-col px-6 py-4 pb-8 lg:px-10 lg:py-4 order-1 lg:order-2 relative z-20" style={{ background: 'white' }}>
          <div className="relative z-10">
            <h2 className="m-0 pt-8 text-3xl lg:text-7xl font-semibold leading-tight font-sans">
              Lighting controls & design services.
            </h2>
            <p className="mt-5 lg:mt-7 text-sm lg:text-base leading-relaxed font-sans text-black">
              From smart dimmers to complete lighting control systems, our team provides 
              expert specification and design services tailored to your project requirements.
            </p>
            
            <div className="flex flex-row gap-4 mt-8 lg:mt-10">
              <LocalizedClientLink
                href="/design-services"
                className="inline-flex items-center justify-center gap-2 px-9 py-4 bg-black text-white text-sm font-medium rounded-none border border-black transition-all duration-200 hover:bg-white hover:text-black"
              >
                CONTACT OUR EXPERTS
              </LocalizedClientLink>

              <LocalizedClientLink
                href="/design-services"
                className="inline-flex items-center justify-center gap-2 px-9 py-4 text-black text-sm font-medium rounded-none border border-black transition-all duration-200 hover:bg-grey-70 hover:text-white"
              >
                GET A QUOTE
              </LocalizedClientLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SecondaryHero
