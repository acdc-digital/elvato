/**
 * Client-safe category utilities
 * These can be imported in client components without server-only dependencies
 */

// Category node type for tree structure
export interface CategoryNode {
  id: string
  name: string
  handle: string
  parentId: string | null
  children: CategoryNode[]
  productCount?: number
}

// Main category IDs from Medusa (7 lighting types)
export const MAIN_CATEGORY_IDS = {
  Chandeliers: "pcat_01KF736S869NMN0XA35AA07XPM",
  Pendants: "pcat_01KF73711R8NF7FV7BKB96PWA6",
  Wall: "pcat_01KF7375B8QDW6HP07AHYCKZQ8",
  Ceiling: "pcat_01KF737B8B0SPRD4DV9W2RGTM8",
  "Table & Floor": "pcat_01KF737DY59JFQDPA35FTCZ7HM",
  Outdoor: "pcat_01KF737MPK7JZFATG1DBV0RBC8",
  Accessories: "pcat_01KF737PCZPCQ39EMRNTJHQT9B",
} as const

export type MainCategoryName = keyof typeof MAIN_CATEGORY_IDS

/**
 * Flattens category tree to a Map for quick lookups
 * This is a pure function that can be used in client components
 */
export function flattenCategoryTree(
  categories: CategoryNode[]
): Map<string, CategoryNode> {
  const map = new Map<string, CategoryNode>()

  const flatten = (cats: CategoryNode[]) => {
    cats.forEach((cat) => {
      map.set(cat.id, cat)
      if (cat.children.length > 0) {
        flatten(cat.children)
      }
    })
  }

  flatten(categories)
  return map
}
