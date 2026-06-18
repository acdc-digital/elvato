import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { GridLayout, GridList } from "@medusajs/icons"
import { Container, IconButton, Tooltip } from "@medusajs/ui"
import { Link } from "react-router-dom"

const ProductCardsViewToggle = () => {
  return (
    <Container className="flex items-center justify-end p-3">
      <div className="flex overflow-hidden rounded-md border border-ui-border-base bg-ui-bg-base shadow-borders-base">
        <Tooltip content="List view">
          <IconButton size="small" variant="secondary" aria-label="List view">
            <GridList />
          </IconButton>
        </Tooltip>
        <Tooltip content="Cards view">
          <IconButton size="small" variant="transparent" asChild>
            <Link to="/product-cards" aria-label="Cards view">
              <GridLayout />
            </Link>
          </IconButton>
        </Tooltip>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.list.before",
})

export default ProductCardsViewToggle