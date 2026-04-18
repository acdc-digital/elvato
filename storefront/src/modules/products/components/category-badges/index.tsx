import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Badge = {
  label: string
  /** Optional collection handle to link to. If omitted, renders as a non-link span. */
  href?: string
  /** Tailwind utility classes for bg / text / ring (matches the Free Shipping badge style). */
  classes: string
}

// Color palette mirrors the emerald "Free Shipping" badge in product-info.
// Each entry uses a 50/700/600/20 family for bg / text / ring tones.
const BADGES: Badge[] = [
  {
    label: "Wall",
    classes:
      "bg-amber-50 text-amber-700 ring-amber-600/20 hover:bg-amber-100",
  },
  {
    label: "Sconce",
    classes:
      "bg-rose-50 text-rose-700 ring-rose-600/20 hover:bg-rose-100",
  },
  {
    label: "Bedroom",
    classes:
      "bg-violet-50 text-violet-700 ring-violet-600/20 hover:bg-violet-100",
  },
  {
    label: "Hotel",
    classes:
      "bg-sky-50 text-sky-700 ring-sky-600/20 hover:bg-sky-100",
  },
  {
    label: "Brass",
    classes:
      "bg-yellow-50 text-yellow-800 ring-yellow-600/20 hover:bg-yellow-100",
  },
  {
    label: "Globe",
    classes:
      "bg-teal-50 text-teal-700 ring-teal-600/20 hover:bg-teal-100",
  },
]

const baseClasses =
  "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset transition-colors"

const CategoryBadges = () => {
  return (
    <div
      className="mt-5 flex flex-wrap gap-2"
      data-testid="product-category-badges"
      aria-label="Product categories"
    >
      {BADGES.map((b) => {
        const className = `${baseClasses} ${b.classes}`
        return b.href ? (
          <LocalizedClientLink
            key={b.label}
            href={b.href}
            className={className}
          >
            {b.label}
          </LocalizedClientLink>
        ) : (
          <span key={b.label} className={className}>
            {b.label}
          </span>
        )
      })}
    </div>
  )
}

export default CategoryBadges
