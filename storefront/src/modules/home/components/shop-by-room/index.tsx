import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const rooms = [
  {
    label: "Bedroom",
    href: "/store?room_types=Bedroom",
    image: "/byRoom/storefront-bedroom 1.svg",
  },
  {
    label: "Bathroom",
    href: "/store?room_types=Bathroom",
    image: "/byRoom/storefront-bathroom 1.svg",
  },
  {
    label: "Dining",
    href: "/store?room_types=Dining",
    image: "/byRoom/storefront-dining 1.svg",
  },
  {
    label: "Kitchen",
    href: "/store?room_types=Kitchen",
    image: "/byRoom/storefront-kitchen 1.svg",
  },
  {
    label: "Office",
    href: "/store?room_types=Office",
    image: "/byRoom/storefront-office 1.svg",
  },
]

export default function ShopByRoom() {
  return (
    <section className="w-full bg-white px-8 small:px-14 py-16 small:py-20">
      <div className="mb-8 flex items-end justify-between small:mb-10">
        <div>
          <p className="mb-3 font-sans text-[11px] uppercase tracking-[0.32em] text-grey-40">
            Start with the space
          </p>
          <h2 className="font-sans text-2xl font-light tracking-tight text-grey-90 small:text-3xl">
            Explore by room
          </h2>
        </div>
        <LocalizedClientLink
          href="/store"
          className="hidden font-sans text-sm tracking-wide text-grey-60 underline-offset-4 transition-colors hover:text-grey-90 hover:underline small:inline-block"
        >
          View all lighting
        </LocalizedClientLink>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 small:grid-cols-5 small:gap-5">
        {rooms.map((room) => (
          <LocalizedClientLink
            key={room.label}
            href={room.href}
            className="group flex flex-col gap-3"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-warm ring-1 ring-black/[0.04]">
              <Image
                src={room.image}
                alt={`Shop ${room.label} lighting`}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            </div>
            <span className="font-sans text-sm tracking-wide text-grey-90 underline-offset-4 transition-all duration-150 group-hover:underline">
              {room.label}
            </span>
          </LocalizedClientLink>
        ))}
      </div>
    </section>
  )
}
