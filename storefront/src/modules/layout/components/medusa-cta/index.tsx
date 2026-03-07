import { Text } from "@medusajs/ui"

const MedusaCTA = () => {
  return (
    <Text className="txt-compact-small-plus text-ui-fg-muted">
      &copy; {new Date().getFullYear()} Elvato. All rights reserved.
    </Text>
  )
}

export default MedusaCTA
