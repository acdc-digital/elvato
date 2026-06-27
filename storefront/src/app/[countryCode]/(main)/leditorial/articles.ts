export type EditorialImage = {
  src: string
  serpapiSearchQuery: string
  alt: string
  caption: string
  placement: string
}

export type EditorialArticle = {
  slug: string
  editorial: {
    date: string
    topic: string
    objective: string
    primaryKeyword: string
    secondaryKeywords: string[]
    searchIntent: string
    targetAudience: string
    funnelStage: string
    articleType: string
    estimatedReadingTime: string
    confidenceScore: string
  }
  seo: {
    metaTitle: string
    metaDescription: string
    ogTitle: string
    ogDescription: string
    canonicalPath: string
  }
  hero: {
    headline: string
    subtitle: string
    featuredImagePrompt: string
  }
  images: EditorialImage[]
  internalLinks: {
    label: string
    href: string
    reason: string
  }[]
  productPlacements: {
    title: string
    href: string
    context: string
  }[]
  faq: {
    question: string
    answer: string
  }[]
  editorialNotes: {
    whyChosenToday: string
    expectedSeoValue: string
    futureFollowUps: string[]
  }
}

export const articles: EditorialArticle[] = [
  {
    slug: "summer-outdoor-lighting-guide",
    editorial: {
      date: "2026-06-27",
      topic:
        "Summer outdoor lighting for Canadian patios, decks, and connected indoor spaces",
      objective:
        "Educate homeowners planning summer hosting spaces while supporting internal links to outdoor, pendant, chandelier, table, floor, and design-service shopping paths.",
      primaryKeyword: "outdoor lighting ideas",
      secondaryKeywords: [
        "patio lighting ideas",
        "deck lighting ideas",
        "outdoor LED lighting Canada",
        "summer lighting ideas",
        "kitchen pendant lighting",
        "dining room chandelier",
      ],
      searchIntent:
        "Homeowners want practical, style-aware lighting guidance before buying fixtures for a patio, deck, dining area, kitchen, or summer renovation.",
      targetAudience:
        "Canadian homeowners, renovators, and design-conscious shoppers preparing indoor-outdoor spaces for summer entertaining.",
      funnelStage:
        "Mid-funnel inspiration with bottom-funnel product discovery",
      articleType: "Seasonal Decorating / Room Guide / Buying Guide",
      estimatedReadingTime: "7 minutes",
      confidenceScore: "8.7/10",
    },
    seo: {
      metaTitle: "Outdoor Lighting Ideas for Canadian Summer Evenings",
      metaDescription:
        "Plan patio, deck, kitchen, and dining lighting for summer hosting with layered outdoor lighting ideas, LED tips, product guidance, and FAQs.",
      ogTitle: "The Summer Lighting Plan for Canadian Homes",
      ogDescription:
        "A practical Elvato guide to layering patio, deck, kitchen, and dining light for longer evenings, safer paths, and better summer hosting.",
      canonicalPath: "/leditorial/summer-outdoor-lighting-guide",
    },
    hero: {
      headline: "The Summer Lighting Plan for Canadian Homes",
      subtitle:
        "How to layer patio, deck, kitchen, and dining light for longer evenings, safer movement, and rooms that feel finished after sunset.",
      featuredImagePrompt:
        "Canadian summer patio connected to a warm kitchen and dining room, layered LED outdoor sconces, pendant lights, soft table lamps, natural materials, editorial residential lighting photography, dusk atmosphere.",
    },
    images: [
      {
        src: "/homepage/v1/room-dining.webp",
        serpapiSearchQuery:
          "Canadian summer dining room warm pendant lighting connected patio dusk",
        alt: "A warm dining room with layered pendant lighting for summer hosting",
        caption:
          "Start indoors: the best outdoor lighting plans often begin with the dining and kitchen glow people see through the glass.",
        placement: "Hero",
      },
      {
        src: "/homepage/v1/room-kitchen.webp",
        serpapiSearchQuery:
          "modern kitchen pendant lighting summer entertaining island LED warm white",
        alt: "A modern kitchen island with warm pendant lighting",
        caption:
          "Kitchen pendants should support prep before sunset and atmosphere once guests arrive.",
        placement: "After section: Start with the threshold",
      },
      {
        src: "/homepage/v1/category-v2-pendants.webp",
        serpapiSearchQuery:
          "covered patio pendant light warm LED contemporary residential design",
        alt: "Contemporary pendant lights suited to transitional entertaining spaces",
        caption:
          "Pendants give covered patios, kitchen islands, and dining zones a clear visual centre.",
        placement: "After section: Use three layers outside",
      },
      {
        src: "/homepage/v1/category-v2-table-floor.webp",
        serpapiSearchQuery:
          "portable table floor lamp layered summer living room patio transition",
        alt: "A table and floor lighting vignette for layered evening ambience",
        caption:
          "Portable table and floor lamps soften corners when fixed ceiling light feels too hard.",
        placement: "Product placement section",
      },
    ],
    internalLinks: [
      {
        label: "Outdoor lighting",
        href: "/store?category_id=pcat_01KF737MPK7JZFATG1DBV0RBC8",
        reason:
          "Primary shopping path for patio, porch, deck, and exterior fixtures.",
      },
      {
        label: "Pendants",
        href: "/collections/pendants",
        reason:
          "Useful for kitchen islands, dining tables, and covered outdoor rooms.",
      },
      {
        label: "Chandeliers",
        href: "/collections/chandeliers",
        reason: "Supports statement dining and covered entertaining spaces.",
      },
      {
        label: "Table and floor lamps",
        href: "/collections/table-floor",
        reason:
          "Supports portable accent lighting and softer evening ambience.",
      },
      {
        label: "Lighting sourcing and selection",
        href: "/design-services",
        reason:
          "Converts readers who need help choosing scale, finish, or a fixture family.",
      },
    ],
    productPlacements: [
      {
        title: "Outdoor lighting edit",
        href: "/store?category_id=pcat_01KF737MPK7JZFATG1DBV0RBC8",
        context:
          "Feature weather-appropriate wall lights, ceiling lights, post lights, lanterns, and outdoor pendants for entry, deck, patio, and path zones.",
      },
      {
        title: "Pendants",
        href: "/collections/pendants",
        context:
          "Use as the natural next click for covered patios, kitchen islands, and dining tables that need focused glow.",
      },
      {
        title: "Chandeliers",
        href: "/collections/chandeliers",
        context:
          "Position as the statement option for dining rooms and protected outdoor entertaining areas with adequate ceiling height.",
      },
      {
        title: "Table and floor lamps",
        href: "/collections/table-floor",
        context:
          "Recommend for living rooms, reading corners, and flexible summer hosting zones where hardwired light is not enough.",
      },
    ],
    faq: [
      {
        question:
          "What is the best colour temperature for outdoor patio lighting?",
        answer:
          "For most residential patios, warm white light between 2700K and 3000K feels comfortable and flattering. Use brighter task lighting only where you cook, grill, or need safer movement.",
      },
      {
        question: "How bright should outdoor deck lighting be?",
        answer:
          "Deck lighting should be bright enough to define steps, edges, doors, and seating without creating glare. Use several lower-output fixtures instead of one intense floodlight.",
      },
      {
        question: "Can indoor pendant lights be used outside?",
        answer:
          "Only use fixtures outside when they are rated for the location. Damp-rated fixtures may suit covered areas, while exposed patios, porches, and decks generally need wet-rated outdoor fixtures.",
      },
      {
        question: "Are LED lights better for outdoor use in Canada?",
        answer:
          "LED fixtures are usually the best choice because they use less energy, last longer, and perform well in frequent evening use. For Canadian homes, check the fixture rating and installation guidance for local weather exposure.",
      },
      {
        question: "How do I make patio lighting look more designed?",
        answer:
          "Layer the light. Combine architectural fixtures for safety, focused light for tables or grilling, and soft accent light around seating, planting, or nearby indoor rooms.",
      },
    ],
    editorialNotes: {
      whyChosenToday:
        "Late June is peak planning and buying season for Canadian outdoor living. Homeowners are hosting, finishing decks, and trying to make kitchens, dining rooms, and patios feel connected after sunset.",
      expectedSeoValue:
        "The article targets evergreen and seasonal queries around outdoor lighting ideas, patio lighting ideas, deck lighting ideas, and outdoor LED lighting in Canada, while reinforcing Elvato topical authority across room lighting, LED guidance, and product selection.",
      futureFollowUps: [
        "Wet-rated vs damp-rated lighting: what Canadian homeowners should know",
        "How high to hang pendant lights over a kitchen island or outdoor table",
        "Best warm white LED colour temperatures by room",
        "A balcony lighting guide for condos and townhomes",
      ],
    },
  },
]

export function getArticleBySlug(slug: string) {
  return articles.find((article) => article.slug === slug)
}
