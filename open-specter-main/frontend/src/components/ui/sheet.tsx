"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
    return (
        <DialogPrimitive.Overlay asChild {...props}>
            <motion.div
                data-slot="sheet-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className={cn("fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]", className)}
            />
        </DialogPrimitive.Overlay>
    );
}

function SheetContent({
    className,
    children,
    side = "right",
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
    side?: "top" | "right" | "bottom" | "left";
}) {
    const sideClass = {
        top: "inset-x-0 top-0 border-b",
        right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
        bottom: "inset-x-0 bottom-0 border-t",
        left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
    }[side];
    const initial = side === "right" ? { x: 24, opacity: 0 } : side === "left" ? { x: -24, opacity: 0 } : side === "top" ? { y: -24, opacity: 0 } : { y: 24, opacity: 0 };

    return (
        <SheetPortal>
            <SheetOverlay />
            <DialogPrimitive.Content asChild {...props}>
                <motion.div
                    data-slot="sheet-content"
                    data-testid={(props as { "data-testid"?: string })["data-testid"] ?? "sheet-content"}
                    initial={initial}
                    animate={{ x: 0, y: 0, opacity: 1 }}
                    exit={initial}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className={cn(
                        "fixed z-50 gap-4 bg-background p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]",
                        sideClass,
                        className,
                    )}
                >
                    {children}
                    <DialogPrimitive.Close className="absolute top-4 right-4 rounded-md p-1 opacity-70 transition-[opacity,background-color] duration-150 hover:bg-muted hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/40">
                        <X className="size-4" />
                        <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>
                </motion.div>
            </DialogPrimitive.Content>
        </SheetPortal>
    );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("flex flex-col gap-2 text-left", className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("mt-auto flex flex-col gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

const SheetTitle = DialogPrimitive.Title;
const SheetDescription = DialogPrimitive.Description;

export {
    Sheet,
    SheetPortal,
    SheetOverlay,
    SheetTrigger,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetTitle,
    SheetDescription,
};
