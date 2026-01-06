import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SecondaryHero = () => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
        {/* Left Panel - Image */}
        <div className="relative bg-white">
          <img 
            src="/Controls-Hero2.svg" 
            alt="Controls Hero"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Panel - Content */}
        <div className="flex flex-col justify-center px-6 py-8 lg:px-10 lg:py-10" style={{ background: 'white' }}>
          <h2 className="m-0 text-3xl lg:text-7xl font-semibold leading-tight font-sans">
            Lighting controls & design services.
          </h2>
          <p className="mt-5 lg:mt-7 text-sm lg:text-base leading-relaxed font-mono text-black">
            From smart dimmers to complete lighting control systems, our team provides 
            expert specification and design services tailored to your project requirements.
          </p>
          
          <div className="flex flex-row gap-4 mt-8 lg:mt-10">
            <LocalizedClientLink
              href="/store"
              className="inline-flex items-center justify-center gap-2 px-9 py-4 bg-black text-white text-sm font-medium rounded-none border border-black transition-all duration-200 hover:bg-white hover:text-black"
            >
              CONTACT OUR EXPERTS
            </LocalizedClientLink>

            <LocalizedClientLink
              href="/store"
              className="inline-flex items-center justify-center gap-2 px-9 py-4 text-black text-sm font-medium rounded-none border border-black transition-all duration-200 hover:bg-[#373737] hover:text-white"
            >
              GET A QUOTE
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SecondaryHero
