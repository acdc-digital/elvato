import Image from "next/image"
import { ArrowUpRight } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Room = {
  label: string
  href: string
  image: string
}

const rooms: Room[] = [
  {
    label: "Bedroom",
    href: "/store?room_types=Bedroom",
    image: "/homepage/v1/room-bedroom.webp",
  },
  {
    label: "Bathroom",
    href: "/store?room_types=Bathroom",
    image: "/homepage/v1/room-bathroom.webp",
  },
  {
    label: "Dining",
    href: "/store?room_types=Dining",
    image: "/homepage/v1/room-dining.webp",
  },
  {
    label: "Kitchen",
    href: "/store?room_types=Kitchen",
    image: "/homepage/v1/room-kitchen.webp",
  },
  {
    label: "Office",
    href: "/store?room_types=Office",
    image: "/homepage/v1/room-office.webp",
  },
]

/**
 * A compact room tile — a small, scannable navigation card. Editorial wash and
 * label, with a quiet arrow that fades up on hover. Built to point the way, not
 * to dominate the page.
 */
function RoomTile({ room }: { room: Room }) {
  return (
    <LocalizedClientLink
      href={room.href}
      className="group relative block aspect-[5/4] overflow-hidden rounded-xl bg-warm ring-1 ring-black/[0.07] transition-all duration-300 hover:ring-black/15 hover:shadow-sm"
    >
      <Image
        src={room.image}
        alt={`Shop ${room.label} lighting`}
        fill
        loading="lazy"
        sizes="(max-width: 1024px) 45vw, 18vw"
        className="object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.06]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent transition-opacity duration-500 group-hover:from-black/75"
      />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3 small:p-3.5">
        <h3 className="font-sans text-sm tracking-tight text-white small:text-[15px]">
          {room.label}
        </h3>
        <ArrowUpRight
          className="h-4 w-4 shrink-0 text-white/0 transition-all duration-300 group-hover:text-white/90"
          strokeWidth={1.75}
        />
      </div>
    </LocalizedClientLink>
  )
}

export default function ShopByRoom() {
  return (
    <section className="w-full bg-white px-6 small:px-14 py-16 small:py-24">
      {/* Section header — folds the old tagline into a real intro */}
      <header className="mb-8 grid grid-cols-1 gap-6 small:mb-10 small:grid-cols-12 small:gap-12">
        <div className="small:col-span-7">
          <p className="mb-4 font-sans text-[11px] uppercase tracking-[0.4em] text-accent-700">
            Start with the space
          </p>
          <h2 className="max-w-2xl font-sans text-4xl font-semibold leading-[1.05] tracking-tight text-grey-90 small:text-5xl">
            Designed room
            <br />
            by room.
          </h2>
        </div>
        <div className="flex flex-col justify-end small:col-span-5">
          <p className="max-w-md font-sans text-[15px] leading-relaxed text-grey-60">
            Every room asks for a different kind of light. Start where you live —
            we&apos;ll show you fixtures chosen to fit the space, the scale, and
            the way you use it.
          </p>
          <LocalizedClientLink
            href="/store"
            className="group mt-6 inline-flex w-fit items-center gap-2 border-b border-grey-40 pb-1 font-sans text-sm tracking-wide text-grey-90 transition-colors hover:border-grey-90"
          >
            View all lighting
            <ArrowUpRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={1.75}
            />
          </LocalizedClientLink>
        </div>
      </header>

      {/* Compact navigation row — five small, scannable tiles */}
      <div className="grid grid-cols-2 gap-3 xsmall:grid-cols-3 small:grid-cols-5 small:gap-4">
        {rooms.map((room) => (
          <RoomTile key={room.label} room={room} />
        ))}
      </div>
    </section>
  )
}
