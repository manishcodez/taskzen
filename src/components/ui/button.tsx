import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-2xl border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-soft hover:bg-primary/92 hover:shadow-card",
        outline:
          "border-border/80 bg-card/80 text-foreground shadow-soft hover:border-primary/25 hover:bg-primary/5",
        secondary:
          "bg-secondary text-secondary-foreground shadow-soft hover:bg-secondary/85",
        ghost: "hover:bg-muted/80 hover:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/15 focus-visible:ring-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-2 px-4",
        xs: "h-7 gap-1 rounded-xl px-2.5 text-xs",
        sm: "h-9 gap-1.5 rounded-xl px-3 text-[0.82rem]",
        lg: "h-11 gap-2 px-5 text-sm",
        icon: "size-10 rounded-2xl",
        "icon-xs": "size-7 rounded-xl",
        "icon-sm": "size-9 rounded-xl",
        "icon-lg": "size-11 rounded-2xl",
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
  render,
  nativeButton,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      nativeButton={nativeButton ?? render === undefined}
      render={render}
      {...props}
    />
  )
}

export { Button, buttonVariants }
