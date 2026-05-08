"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

function TabsList({
    className,
    ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
    return (
        <TabsPrimitive.List
            data-slot="tabs-list"
            data-testid={(props as { "data-testid"?: string })["data-testid"] ?? "tabs-list"}
            className={cn(
                "inline-flex h-10 items-center justify-center rounded-xl bg-muted p-1 text-muted-foreground",
                className,
            )}
            {...props}
        />
    );
}

function TabsTrigger({
    className,
    children,
    ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
    return (
        <TabsPrimitive.Trigger
            data-slot="tabs-trigger"
            data-testid={(props as { "data-testid"?: string })["data-testid"] ?? "tabs-trigger"}
            className={cn(
                "group relative inline-flex h-8 items-center justify-center whitespace-nowrap rounded-lg px-3 text-sm font-medium outline-none transition-[color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-ring/35 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground",
                className,
            )}
            {...props}
        >
            <span className="absolute inset-0 rounded-lg bg-card opacity-0 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-opacity duration-200 group-data-[state=active]:opacity-100" />
            <span className="relative z-10">{children}</span>
        </TabsPrimitive.Trigger>
    );
}

function TabsContent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
    return (
        <TabsPrimitive.Content asChild {...props}>
            <motion.div
                data-slot="tabs-content"
                data-testid={(props as { "data-testid"?: string })["data-testid"] ?? "tabs-content"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className={cn("mt-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/35", className)}
            >
                {children}
            </motion.div>
        </TabsPrimitive.Content>
    );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
