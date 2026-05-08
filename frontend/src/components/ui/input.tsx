"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

const MotionInput = motion.input as React.ElementType;

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    const prefersReducedMotion = useReducedMotion();

    return (
        <MotionInput
            type={type}
            data-slot="input"
            data-testid={(props as { "data-testid"?: string })["data-testid"] ?? "ui-input"}
            whileFocus={
                prefersReducedMotion
                    ? undefined
                    : {
                          boxShadow:
                              "0 0 0 3px rgba(2, 6, 23, 0.10), 0 1px 2px rgba(0,0,0,0.04)",
                      }
            }
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={cn(
                "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground h-9 w-full min-w-0 rounded-[10px] border border-input bg-card px-3 py-1 text-base shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-[background-color,border-color,color,box-shadow] duration-200 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium hover:border-foreground/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35",
                "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
                className,
            )}
            {...props}
        />
    );
}

export { Input };
