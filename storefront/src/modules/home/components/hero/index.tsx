"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"

const Hero = () => {
  return (
    <div className="min-h-[75vh] lg:h-[75vh] w-full border-b border-black relative bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_80px_1fr] h-full">
        {/* Left: Content */}
        <div className="flex flex-col bg-white order-1">
          {/* Buttons */}
          <div className="px-4 pt-4 pb-4 lg:px-8 lg:pt-6 lg:pb-0">
            <ButtonGroup className="flex-wrap">
              {['pendants', 'chandeliers', 'ceiling', 'wall', 'desk & floor', 'controls', 'sale'].map((badge) => (
                <Button 
                  key={badge}
                  variant="link"
                  className="font-mono uppercase tracking-wide"
                >
                  {badge}
                </Button>
              ))}
            </ButtonGroup>
          </div>

          <div className="flex flex-col justify-center flex-1 px-6 pt-0 pb-8 lg:px-10 lg:pt-0 lg:pb-10">
            <h1 className="m-0 text-4xl lg:text-7xl font-semibold leading-tight font-sans">
              Contemporary lighting for your next project.
            </h1>
            <p className="mt-5 lg:mt-7 text-sm lg:text-base leading-relaxed font-mono text-black">
              Elvato lighting is a curated collection of affordable – handpicked lighting designs
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
                href="/store"
                className="inline-flex items-center justify-center gap-2 px-9 py-4 text-black text-sm font-medium rounded-none border border-black transition-all duration-200 hover:bg-[#373737] hover:text-white"
              >
                DESIGN SERVICES
              </LocalizedClientLink>
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
                        src="/scroll-E.svg" 
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
                        src="/scroll-E.svg" 
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
        <div className="hidden lg:flex items-center justify-center order-2 bg-white border-l border-r border-black overflow-hidden relative">
          <div className="flex flex-col overflow-hidden h-full">
            <div className="flex flex-col animate-ticker-vertical">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col items-center py-3">
                  <div className="w-8 h-8 mb-4">
                    <img 
                      src="/scroll-E.svg" 
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
                      src="/scroll-E.svg" 
                      alt=""
                      className="w-full h-auto"
                    />
                  </div>
                  <span className="writing-vertical text-2xl font-bold font-sans text-black rotate-180">{i % 2 === 0 ? 'COUPON' : 'SAVE15'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Hero Image */}
        <div className="order-3 bg-gray-100 relative min-h-[200px] lg:min-h-0 overflow-hidden">
          {/* Grid of squares at the top */}
          <div className="absolute top-0 left-0 right-0 z-10 grid grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                className="aspect-square bg-white border-t lg:border-t-0 border-b border-r border-black"
              />
            ))}
          </div>
          
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
