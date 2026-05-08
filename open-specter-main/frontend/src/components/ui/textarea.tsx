"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

const MotionTextarea = motion.textarea as React.ElementType;

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
    const prefersReducedMotion = useReducedMotion();

    return (
        <MotionTextarea
            data-slot="textarea"
            data-testid={(props as { "data-testid"?: string })["data-testid"] ?? "ui-textarea"}
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
                "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground min-h-24 w-full rounded-[10px] border border-input bg-card px-3 py-2 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-[background-color,border-color,color,box-shadow] duration-200 hover:border-foreground/20 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
                className,
            )}
            {...props}
        />
    );
}

export { Textarea };
