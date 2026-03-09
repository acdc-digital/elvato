"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = () => {
  return (
    <div className="min-h-[75vh] lg:h-[75vh] w-full border-b border-black relative bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
        {/* Left: Content */}
        <div className="flex flex-col order-1" style={{ background: 'linear-gradient(to right, #F5F5F5, #FFFFFF)' }}>
          {/* Buttons */}
          <div className="px-4 pt-4 pb-4 lg:px-8 lg:pt-6 lg:pb-0">
            <div className="flex flex-wrap gap-1">
              {[
                { label: 'Featured', href: '/store' },
                { label: 'Chandeliers', href: '/store' },
                { label: 'Pendants', href: '/store' },
                { label: 'Ceiling', href: '/store' },
                { label: 'Wall', href: '/store' },
                { label: 'Desk & Floor', href: '/store' },
                { label: 'Controls', href: '/store' },
                { label: 'Sale', href: '/store' },
              ].map((badge) => (
                <LocalizedClientLink
                  key={badge.label}
                  href={badge.href}
                  className={`px-3 py-1 text-sm font-sans font-medium uppercase tracking-wide hover:underline underline-offset-4 transition-all duration-200 ${badge.label === 'Sale' ? 'text-red-600' : 'text-black'}`}
                >
                  {badge.label}
                </LocalizedClientLink>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center flex-1 px-6 pt-0 pb-8 lg:px-10 lg:pt-0 lg:pb-10">
            <h1 className="m-0 text-4xl lg:text-7xl font-bold leading-tight font-sans">
              <span className="relative inline-block">
                <span className="relative z-10">Contemporary</span>
                <span
                  className="absolute left-0 bottom-[0.1em] w-full h-[0.35em] bg-yellow-300/60 -z-0 -rotate-[0.5deg]"
                  aria-hidden="true"
                />
              </span>{" "}
              lighting for your next project.
            </h1>
            <p className="mt-5 lg:mt-7 text-sm lg:text-base leading-relaxed font-sans text-black">
              Elvato lighting is a curated collection of 803 published, affordable handpicked lighting designs
              sourced from top manufacturers around the world.
            </p>
            
            <div className="flex flex-row gap-4 mt-8 lg:mt-10">
              <LocalizedClientLink
                href="/store"
                className="inline-flex items-center justify-center gap-2 px-9 py-4 bg-black text-white text-sm font-medium rounded-none border border-black transition-all duration-200 hover:bg-white hover:text-black"
              >
                SHOP NOW
              </LocalizedClientLink>

              <LocalizedClientLink
                href="/design-services"
                className="inline-flex items-center justify-center gap-2 px-9 py-4 text-black text-sm font-normal rounded-none border border-black transition-all duration-200 hover:bg-grey-70 hover:text-white"
              >
                DESIGN SERVICES
              </LocalizedClientLink>
            </div>

            {/* Trust Signals */}
            <div className="flex items-center gap-6 mt-6 text-xs font-sans text-gray-500">
              <div className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>30-Day Guarantee</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                <span>Free Shipping $1,500+</span>
              </div>
              <span>803 Published Designs</span>
            </div>
          </div>

          {/* Mobile Ticker (horizontal) */}
          <div className="hidden border-t border-black overflow-hidden mt-8 -mx-6 px-0 h-14">
            <div className="flex flex-nowrap h-full items-center">
              <div className="flex whitespace-nowrap animate-ticker flex-shrink-0">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="flex items-center mr-4 flex-shrink-0 py-3">
                    <div className="w-7 mr-5">
                      <img 
                        src="/brand/brand/scroll-E.svg" 
                        alt=""
                        className="w-full h-auto"
                      />
                    </div>
                    <p className="m-0 text-xl font-bold font-sans text-black">{i % 2 === 0 ? 'COUPON' : 'SAVE15'}</p>
                  </div>
                ))}
              </div>
              <div className="flex whitespace-nowrap animate-ticker flex-shrink-0">
                {[...Array(12)].map((_, i) => (
                  <div key={`dup-${i}`} className="flex items-center mr-4 flex-shrink-0 py-3">
                    <div className="w-7 mr-5">
                      <img 
                        src="/brand/scroll-E.svg" 
                        alt=""
                        className="w-full h-auto"
                      />
                    </div>
                    <p className="m-0 text-xl font-bold font-sans text-black">{i % 2 === 0 ? 'COUPON' : 'SAVE15'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Vertical Ticker */}
        {/* <div className="hidden lg:flex items-center justify-center order-2 bg-white border-l border-r border-black overflow-hidden relative">
          <div className="flex flex-col overflow-hidden h-full">
            <div className="flex flex-col animate-ticker-vertical">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col items-center py-3">
                  <div className="w-8 h-8 mb-4">
                    <img 
                      src="/brand/scroll-E.svg" 
                      alt=""
                      className="w-full h-auto"
                    />
                  </div>
                  <span className="writing-vertical text-2xl font-bold font-sans text-black rotate-180">{i % 2 === 0 ? 'COUPON' : 'SAVE15'}</span>
                </div>
              ))}
              {[...Array(8)].map((_, i) => (
                <div key={`dup-${i}`} className="flex flex-col items-center py-3">
                  <div className="w-8 h-8 mb-4">
                    <img 
                      src="/brand/scroll-E.svg" 
                      alt=""
                      className="w-full h-auto"
                    />
                  </div>
                  <span className="writing-vertical text-2xl font-bold font-sans text-black rotate-180">{i % 2 === 0 ? 'COUPON' : 'SAVE15'}</span>
                </div>
              ))}
            </div>
          </div>
        </div> */}

        {/* Right: Hero Image */}
        <div className="order-3 bg-gray-100 relative min-h-[200px] lg:min-h-0 overflow-hidden">
          {/* Grid of squares at the top */}
          <div className="absolute top-0 left-0 right-0 z-10 grid grid-cols-5">
            {[
              "/products/modern-retro-wall-sconce-vintage-industrial-design-01ce7684?v_id=variant_01KJK3N8TXJM2TJ05JQZJ0HP0S",
              "/products/modern-hollow-staircase-chandelier-duplex-design-55298816",
              "/products/modern-luxury-glass-bubble-chandelier-55049984",
              "/products/nordic-flying-saucer-chandelier-postmodern-art-design-93837056?v_id=variant_01KK4BYCY4JCSQQTTY7FNEYK56",
              "/products/postmodern-creative-chandelier-for-living-rooms-06790656",
            ].map((href, i) => (
              <LocalizedClientLink
                key={i}
                href={href}
                className="aspect-square bg-white border-t lg:border-t-0 border-b border-r border-black overflow-hidden relative block"
              >
                <div className="absolute top-0 left-0 bg-black text-white px-2.5 py-1 text-xs font-sans uppercase z-10">
                  Featured
                </div>
                {i === 0 && (
                  <img 
                    src="/hero/H-feature-2.svg" 
                    alt="Featured"
                    className="w-full h-full object-cover"
                  />
                )}
                {i === 1 && (
                  <div className="w-full h-full bg-[#AAAAAA]">
                    <img 
                      src="/hero/H-feature-3.svg" 
                      alt="Featured"
                      className="w-full h-full object-cover scale-125 -translate-y-5 -translate-x-3"
                    />
                  </div>
                )}
                {i === 2 && (
                  <img 
                    src="/hero/H-feature-4.svg"
                    alt="Featured"
                    className="w-full h-full object-cover scale-125 translate-y-1"
                  />
                )}
                {i === 3 && (
                  <img 
                    src="/hero/H-feature-5.svg"
                    alt="Featured"
                    className="w-full h-full object-cover scale-125 -translate-y-2"
                  />
                )}
                {i === 4 && (
                  <img 
                    src="/hero/H-feature-6.svg" 
                    alt="Featured"
                    className="w-full h-full object-cover scale-110"
                  />
                )}
              </LocalizedClientLink>
            ))}
          </div>
          
          <LocalizedClientLink href="/products/nordic-minimalist-resin-art-chandelier" className="block w-full h-full">
            <img 
              src="/hero/hero-2.jpg" 
              alt="Elvato"
              className="w-full h-full object-cover"
              style={{ objectPosition: '30% center' }}
            />
          </LocalizedClientLink>
          {/* Overlay image - hugs left border, hidden on mobile */}
          <img 
            src="/overlays/crinkle-v2.svg" 
            alt=""
            className="hidden lg:block absolute -left-6 top-1/2 -translate-y-1/2 h-[115%] w-auto object-contain z-20"
          />
          {/* Gradient overlay on crinkle */}
          <div 
            className="hidden lg:block absolute -left-6 top-1/2 -translate-y-1/2 h-[115%] w-[120px] z-20 pointer-events-none"
            style={{ 
              background: 'linear-gradient(to right, #F5F5F5, transparent)',
              mixBlendMode: 'overlay'
            }}
          />
          {/* Discount text overlay */}
          {/* <div className="absolute top-24 left-44 font-mono text-white flex flex-col leading-tight">
            <span className="text-lg lg:text-6xl font-black">75%</span>
            <span className="text-sm lg:text-6xl font-normal">off</span>
          </div> */}
        </div>
      </div>

      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes ticker-vertical {
          0% { transform: translateY(0%); }
          100% { transform: translateY(-50%); }
        }
        .animate-ticker {
          animation: ticker 32s infinite linear;
        }
        .animate-ticker-vertical {
          animation: ticker-vertical 20s infinite linear;
        }
        .writing-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
    </div>
  )
}

export default Hero
