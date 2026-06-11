import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-1.5",
    "rounded-lg border border-transparent bg-clip-padding",
    "text-sm font-medium whitespace-nowrap",
    "cursor-pointer select-none outline-none",
    // transition
    "transition-all duration-150 ease-out",
    // focus
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    // disabled
    "disabled:pointer-events-none disabled:opacity-40",
    // validation
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
    // icon children
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    // press feedback
    "active:not-aria-[haspopup]:scale-[0.97] active:not-aria-[haspopup]:brightness-95",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground shadow-sm",
          "hover:brightness-110 hover:shadow-md",
        ].join(" "),
        outline: [
          "border-border bg-background text-foreground shadow-sm",
          "hover:bg-muted hover:border-gray-300 dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
          "aria-expanded:bg-muted aria-expanded:text-foreground",
        ].join(" "),
        secondary: [
          "bg-secondary text-secondary-foreground shadow-sm",
          "hover:bg-secondary/70",
          "aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ].join(" "),
        ghost: [
          "hover:bg-muted hover:text-foreground",
          "aria-expanded:bg-muted aria-expanded:text-foreground",
          "dark:hover:bg-muted/50",
        ].join(" "),
        destructive: [
          "bg-destructive/10 text-destructive shadow-sm",
          "hover:bg-destructive/20 hover:shadow-md",
          "focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
          "dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        ].join(" "),
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3.5",
        xs:      "h-6 px-2 text-xs rounded-md [&_svg:not([class*='size-'])]:size-3",
        sm:      "h-7 px-2.5 text-[0.8rem] rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        lg:      "h-10 px-4 text-base",
        icon:    "size-9",
        "icon-xs":  "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":  "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg":  "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
