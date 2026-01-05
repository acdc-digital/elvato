import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@lib/utils"

interface ButtonGroupContextValue {
  orientation: "horizontal" | "vertical"
}

const ButtonGroupContext = React.createContext<ButtonGroupContextValue>({
  orientation: "horizontal",
})

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => {
    return (
      <ButtonGroupContext.Provider value={{ orientation }}>
        <div
          ref={ref}
          role="group"
          className={cn(
            "flex",
            orientation === "horizontal"
              ? "flex-row items-center"
              : "flex-col items-start",
            className
          )}
          {...props}
        />
      </ButtonGroupContext.Provider>
    )
  }
)
ButtonGroup.displayName = "ButtonGroup"

export interface ButtonGroupSeparatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
}

const ButtonGroupSeparator = React.forwardRef<
  HTMLDivElement,
  ButtonGroupSeparatorProps
>(({ className, orientation: orientationProp, ...props }, ref) => {
  const { orientation: groupOrientation } =
    React.useContext(ButtonGroupContext)
  const orientation = orientationProp || groupOrientation === "horizontal"
    ? "vertical"
    : "horizontal"

  return (
    <div
      ref={ref}
      className={cn(
        "bg-border",
        orientation === "vertical" ? "h-full w-px" : "h-px w-full",
        className
      )}
      {...props}
    />
  )
})
ButtonGroupSeparator.displayName = "ButtonGroupSeparator"

export interface ButtonGroupTextProps
  extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
}

const ButtonGroupText = React.forwardRef<HTMLDivElement, ButtonGroupTextProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div"
    return (
      <Comp
        ref={ref}
        className={cn("px-3 text-sm font-medium", className)}
        {...props}
      />
    )
  }
)
ButtonGroupText.displayName = "ButtonGroupText"

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText }
