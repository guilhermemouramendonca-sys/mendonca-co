import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-gold/20 text-gold border border-gold/30",
        success: "bg-success/20 text-success border border-success/30",
        warning: "bg-warning/20 text-[#B8860B] border border-warning/30",
        danger: "bg-danger/20 text-danger border border-danger/30",
        muted: "bg-[#E8D5A3]/30 text-text-muted border border-[#E8D5A3]",
        primary: "bg-primary text-gold border border-gold/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
