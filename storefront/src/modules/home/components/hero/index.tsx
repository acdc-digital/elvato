"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = () => {
  return (
    <div className="min-h-[85vh] lg:h-[85vh] w-full border-b border-black relative bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_80px_1fr] h-full">
        {/* Left: Content */}
        <div className="flex flex-col px-6 py-8 lg:px-12 lg:py-10 bg-white order-1">
          {/* Badges */}
          <div className="flex flex-wrap gap-3 mb-8 lg:mb-auto">
            {['pendants', 'chandeliers', 'ceiling', 'wall', 'desk & floor', 'controls', 'sale'].map((badge) => (
              <button 
                key={badge}
                className="px-5 py-3 bg-white text-black text-sm font-mono uppercase tracking-wide transition-all duration-200 border border-black hover:bg-gray-100 rounded-md"
              >
                {badge}
              </button>
            ))}
          </div>

          <div className="flex flex-col justify-center flex-1">
            <h1 className="m-0 text-3xl lg:text-5xl font-bold leading-tight font-sans">
              Brandable domains for your next project.
            </h1>
            <p className="mt-5 lg:mt-7 text-sm lg:text-base leading-relaxed font-mono text-black">
              Brandlesse is a curated collection of premium .coms – handpicked, brand-ready, and available to be transferred to you today.
            </p>
            
            <LocalizedClientLink
              href="/store"
              className="inline-flex items-center justify-center gap-2 mt-8 lg:mt-10 px-9 py-4 bg-black text-white text-sm font-medium rounded-full border-none transition-all duration-200 hover:bg-gray-800 max-w-fit"
            >
              GET A DOMAIN
            </LocalizedClientLink>
          </div>

          {/* Mobile Ticker (horizontal) */}
          <div className="block lg:hidden border-t border-black overflow-hidden mt-8 -mx-6 px-0 h-12">
            <div className="flex flex-nowrap h-full items-center overflow-y-hidden">
              <div className="flex whitespace-nowrap animate-ticker flex-shrink-0">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="flex items-center mr-4 flex-shrink-0 py-2">
                    <div className="w-6 mr-2">
                      <img 
                        src="//brandlesse.com/cdn/shop/files/Favicon_HD_White.png?v=1763590593" 
                        alt=""
                        className="w-full h-auto"
                      />
                    </div>
                    <p className="m-0 text-lg font-bold font-sans text-black leading-none">com</p>
                  </div>
                ))}
              </div>
              <div className="flex whitespace-nowrap animate-ticker flex-shrink-0">
                {[...Array(12)].map((_, i) => (
                  <div key={`dup-${i}`} className="flex items-center mr-4 flex-shrink-0 py-2">
                    <div className="w-6 mr-2">
                      <img 
                        src="//brandlesse.com/cdn/shop/files/Favicon_HD_White.png?v=1763590593" 
                        alt=""
                        className="w-full h-auto"
                      />
                    </div>
                    <p className="m-0 text-lg font-bold font-sans text-black leading-none">com</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Vertical Ticker */}
        <div className="hidden lg:flex items-center justify-center order-2 bg-white border-l border-r border-black overflow-hidden relative">
          <div className="flex flex-col overflow-hidden h-full">
            <div className="flex flex-col animate-ticker-vertical">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col items-center py-3">
                  <div className="w-8 h-8 mb-2">
                    <img 
                      src="//brandlesse.com/cdn/shop/files/Favicon_HD_White.png?v=1763590593" 
                      alt=""
                      className="w-full h-auto"
                    />
                  </div>
                  <span className="writing-vertical text-2xl font-bold font-sans text-black rotate-180">com</span>
                </div>
              ))}
              {[...Array(8)].map((_, i) => (
                <div key={`dup-${i}`} className="flex flex-col items-center py-3">
                  <div className="w-8 h-8 mb-2">
                    <img 
                      src="//brandlesse.com/cdn/shop/files/Favicon_HD_White.png?v=1763590593" 
                      alt=""
                      className="w-full h-auto"
                    />
                  </div>
                  <span className="writing-vertical text-2xl font-bold font-sans text-black rotate-180">com</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Hero Image */}
        <div className="order-3 bg-gray-100 relative min-h-[200px] lg:min-h-0 overflow-hidden">
          <img 
            src="/solo2.jpg" 
            alt="Elvato"
            className="w-full h-full object-cover"
            style={{ objectPosition: '30% center' }}
          />
          {/* Overlay image - hugs left border, hidden on mobile */}
          <img 
            src="/crinkle-v2.svg" 
            alt=""
            className="hidden lg:block absolute -left-5 top-1/2 -translate-y-1/2 h-[115%] w-auto object-contain"
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
