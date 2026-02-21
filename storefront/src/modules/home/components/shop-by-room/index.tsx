import LocalizedClientLink from "@modules/common/components/localized-client-link"

const rooms = [
  {
    label: "Bedroom",
    href: "/collections/bedroom",
    image: "/rooms/bedroom.jpg",
  },
  {
    label: "Bathroom",
    href: "/collections/bathroom",
    image: "/rooms/bathroom.jpg",
  },
  {
    label: "Dining",
    href: "/collections/dining",
    image: "/rooms/dining.jpg",
  },
  {
    label: "Kitchen",
    href: "/collections/kitchen",
    image: "/rooms/kitchen.jpg",
  },
  {
    label: "Office",
    href: "/collections/office",
    image: "/rooms/office.jpg",
  },
]

export default function ShopByRoom() {
  return (
    <section className="w-full bg-white px-8 small:px-12 py-10">
      <h2 className="text-sm font-mono text-black mb-6 tracking-wider">
        Shop by room
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {rooms.map((room) => (
          <LocalizedClientLink
            key={room.label}
            href={room.href}
            className="group flex flex-col gap-3"
          >
            {/* Image card */}
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f0eeea] rounded-sm">
              {/* Placeholder — replace with <Image> once real photos are added */}
              <div className="absolute inset-0 flex items-end justify-start p-3 opacity-0">
                {/* reserved for image overlay if needed */}
              </div>
              {/* Placeholder visual */}
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-[10px] font-mono text-gray-300 uppercase tracking-widest select-none">
                  {room.label}
                </span>
              </div>
            </div>
            {/* Label */}
            <span className="text-sm font-mono text-black group-hover:underline underline-offset-4 transition-all duration-150">
              {room.label}
            </span>
          </LocalizedClientLink>
        ))}
      </div>
    </section>
  )
}
