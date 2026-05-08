"use client";

import React, { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface Tab<T extends string> {
    id: T;
    label: string;
}

interface Props<T extends string> {
    tabs: Tab<T>[];
    active: T;
    onChange: (id: T) => void;
    /** Optional content rendered on the right side of the toolbar */
    actions?: React.ReactNode;
}

export function ToolbarTabs<T extends string>({
    tabs,
    active,
    onChange,
    actions,
}: Props<T>) {
    const prefersReducedMotion = useReducedMotion();
    const layoutId = useId().replace(/:/g, "");

    return (
        <div
            className="flex min-h-14 items-center justify-between gap-4 border-b border-gray-200 bg-white/92 px-4 py-2.5 backdrop-blur-sm sm:px-8"
            data-testid="toolbar-tabs"
        >
            <div
                role="tablist"
                aria-label="Page sections"
                className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-gray-200 bg-gray-50/90 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(2,6,23,0.04)]"
                data-testid="toolbar-tabs-list"
            >
                {tabs.map((tab) => {
                    const isActive = active === tab.id;
                    return (
                        <motion.button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            data-testid={`toolbar-tab-${tab.id}`}
                            onClick={() => onChange(tab.id)}
                            className={cn(
                                "relative min-h-9 whitespace-nowrap rounded-xl px-4 py-2 font-space-grotesk text-sm font-[520] tracking-[-0.01em] outline-none transition-[color] duration-150 focus-visible:ring-2 focus-visible:ring-ring/35",
                                isActive
                                    ? "text-gray-950"
                                    : "text-gray-500 hover:text-gray-800",
                            )}
                            whileHover={
                                prefersReducedMotion ? undefined : { y: -1 }
                            }
                            whileTap={
                                prefersReducedMotion
                                    ? undefined
                                    : { scale: 0.985 }
                            }
                            transition={{ duration: 0.16, ease: "easeOut" }}
                        >
                            {isActive && (
                                <motion.span
                                    layoutId={`toolbar-tabs-active-pill-${layoutId}`}
                                    className="absolute inset-0 rounded-xl border border-gray-200 bg-white shadow-[0_6px_18px_rgba(2,6,23,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]"
                                    transition={{
                                        duration: prefersReducedMotion ? 0 : 0.22,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                />
                            )}
                            <span className="relative z-10">{tab.label}</span>
                        </motion.button>
                    );
                })}
            </div>
            {actions && (
                <div
                    className="flex shrink-0 items-center gap-1"
                    data-testid="toolbar-tabs-actions"
                >
                    {actions}
                </div>
            )}
        </div>
    );
}
