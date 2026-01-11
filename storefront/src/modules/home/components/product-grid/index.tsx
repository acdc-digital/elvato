import LocalizedClientLink from "@modules/common/components/localized-client-link"

const ProductGrid = () => {
  const products = [
    {
      id: 1,
      title: "Product Title",
      subtitle: "(product.subtitle)",
      price: "$995.00",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.",
      image: "/placeholder.jpg",
      href: "#",
    },
    {
      id: 2,
      title: "Product Title",
      subtitle: "(product.subtitle)",
      price: "$995.00",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.",
      image: "/placeholder.jpg",
      href: "#",
    },
    {
      id: 3,
      title: "Product Title",
      subtitle: "(product.subtitle)",
      price: "$995.00",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.",
      image: "/placeholder.jpg",
      href: "#",
    },
    {
      id: 4,
      title: "Product Title",
      subtitle: "(product.subtitle)",
      price: "$995.00",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.",
      image: "/placeholder.jpg",
      href: "#",
    },
  ]

  return (
    <div className="px-8 small:px-12 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((product) => (
          <LocalizedClientLink
            key={product.id}
            href={product.href}
            className="block"
          >
            <div className="flex flex-col sm:flex-row bg-white rounded-2xl border border-gray-200 overflow-hidden h-[415px] hover:shadow-lg transition-shadow duration-200">
              {/* Left: Image */}
              <div className="sm:w-1/2 h-1/2 sm:h-full bg-gray-100 flex items-center justify-center p-6 border-b sm:border-b-0 sm:border-r border-gray-200">
                <div className="w-full h-full bg-white rounded-lg border border-gray-300 flex items-center justify-center">
                  <span className="text-gray-400 font-mono text-sm">Image</span>
                </div>
              </div>

              {/* Right: Content */}
              <div className="sm:w-1/2 flex flex-col justify-center p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold uppercase font-sans tracking-wide">
                  {product.title}
                </h3>
                <p className="text-lg sm:text-xl font-bold uppercase font-sans tracking-wide text-gray-600">
                  {product.subtitle}
                </p>
                <p className="mt-4 text-lg font-mono text-black">
                  {product.price}
                </p>
                <p className="mt-4 text-sm font-mono text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              </div>
            </div>
          </LocalizedClientLink>
        ))}
      </div>
    </div>
  )
}

export default ProductGrid
