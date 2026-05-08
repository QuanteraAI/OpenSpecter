"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

function TooltipContent({
    className,
    sideOffset = 6,
    children,
    "data-testid": dataTestId,
    style,
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> & {
    "data-testid"?: string;
}) {
    return (
        <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
                sideOffset={sideOffset}
                className="pointer-events-none z-[2147483647]"
                style={{ zIndex: 2147483647, ...style }}
                {...props}
            >
                <motion.div
                    data-slot="tooltip-content"
                    data-testid={dataTestId ?? "tooltip-content"}
                    initial={{ opacity: 0, y: 3, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 3, scale: 0.98 }}
                    transition={{ duration: 0.14, ease: "easeOut" }}
                    className={cn(
                        "pointer-events-none z-[2147483647] max-w-xs rounded-lg border border-border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-[0_10px_26px_rgba(0,0,0,0.14)]",
                        className,
                    )}
                >
                    {children}
                </motion.div>
            </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
    );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
