import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const rooms = [
  {
    label: "Bedroom",
    href: "/collections/bedroom",
    image: "/byRoom/storefront-bedroom 1.png",
  },
  {
    label: "Bathroom",
    href: "/collections/bathroom",
    image: "/byRoom/storefront-bathroom 1.png",
  },
  {
    label: "Dining",
    href: "/collections/dining",
    image: "/byRoom/storefront-dining 1.png",
  },
  {
    label: "Kitchen",
    href: "/collections/kitchen",
    image: "/byRoom/storefront-kitchen 1.png",
  },
  {
    label: "Office",
    href: "/collections/office",
    image: "/byRoom/storefront-office 1.png",
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
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f0eeea] rounded-sm">
              <Image
                src={room.image}
                alt={`Shop ${room.label} lighting`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
              />
            </div>
            <span className="text-sm font-mono text-black group-hover:underline underline-offset-4 transition-all duration-150">
              {room.label}
            </span>
          </LocalizedClientLink>
        ))}
      </div>
    </section>
  )
}
