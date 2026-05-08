"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

const MotionButton = motion.button as React.ElementType;

const buttonVariants = cva(
    "font-space-grotesk inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-medium outline-none transition-[background-color,border-color,color,box-shadow] duration-200 ease-out disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive aria-invalid:ring-destructive/20",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.08)] hover:bg-primary/92 hover:shadow-[0_6px_18px_rgba(0,0,0,0.14)]",
                destructive:
                    "bg-destructive text-white shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/25",
                outline:
                    "border border-border bg-background text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-foreground/20 hover:bg-muted/70 hover:shadow-[0_5px_16px_rgba(0,0,0,0.08)]",
                secondary:
                    "border border-border bg-secondary text-secondary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-secondary/80 hover:shadow-[0_5px_16px_rgba(0,0,0,0.08)]",
                ghost: "bg-transparent text-foreground hover:bg-muted/80",
                link: "h-auto rounded-none p-0 text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-9 px-4 py-2 has-[>svg]:px-3",
                sm: "h-8 gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
                lg: "h-10 px-5 text-base has-[>svg]:px-4",
                icon: "size-9",
                "icon-sm": "size-8",
                "icon-lg": "size-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

type ButtonProps = React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
        motionEnabled?: boolean;
        loading?: boolean;
    };

function Button({
    className,
    variant,
    size,
    asChild = false,
    motionEnabled = true,
    loading = false,
    disabled,
    children,
    ...props
}: ButtonProps) {
    const prefersReducedMotion = useReducedMotion();
    const isDisabled = disabled || loading;
    const classes = cn(buttonVariants({ variant, size, className }));

    if (asChild) {
        return (
            <Slot
                data-slot="button"
                data-testid={(props as { "data-testid"?: string })["data-testid"] ?? "ui-button"}
                className={classes}
                aria-busy={loading || undefined}
                {...props}
            >
                {children}
            </Slot>
        );
    }

    const hover =
        motionEnabled && !prefersReducedMotion && !isDisabled
            ? { y: -1 }
            : undefined;
    const tap =
        motionEnabled && !prefersReducedMotion && !isDisabled
            ? { scale: 0.98 }
            : undefined;

    return (
        <MotionButton
            data-slot="button"
            data-testid={(props as { "data-testid"?: string })["data-testid"] ?? "ui-button"}
            className={classes}
            disabled={isDisabled}
            aria-busy={loading || undefined}
            whileHover={hover}
            whileTap={tap}
            transition={{ duration: 0.16, ease: "easeOut" }}
            {...props}
        >
            {loading && (
                <span
                    className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80"
                    aria-hidden="true"
                />
            )}
            {children}
        </MotionButton>
    );
}

export { Button, buttonVariants };
