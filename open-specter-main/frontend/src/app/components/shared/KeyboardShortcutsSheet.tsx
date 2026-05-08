"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

interface KeyboardShortcutsSheetProps {
    open: boolean;
    onClose: () => void;
}

const shortcutGroups = [
    {
        title: "General",
        items: [
            { label: "Toggle sidebar", keys: ["⌘", "B"] },
            { label: "Open shortcuts", keys: ["⌘", "/"] },
        ],
    },
    {
        title: "Navigation",
        items: [
            { label: "Go to Assistant", keys: ["⌘", "1"] },
            { label: "Go to Projects", keys: ["⌘", "2"] },
            { label: "Go to Tabular Review", keys: ["⌘", "3"] },
            { label: "Go to Workflows", keys: ["⌘", "4"] },
        ],
    },
    {
        title: "Creation",
        items: [
            { label: "New assistant chat", keys: ["⌘", "N"] },
            { label: "Focus prompt", keys: ["⌘", "J"] },
        ],
    },
    {
        title: "Account",
        items: [
            { label: "Open settings", keys: ["⌘", ","] },
            { label: "Close sheet", keys: ["Esc"] },
        ],
    },
];

function Keycap({ children }: { children: string }) {
    return (
        <kbd className="inline-flex min-w-8 items-center justify-center rounded-lg border border-border bg-muted/45 px-2.5 py-1.5 font-space-grotesk text-xs font-[520] text-foreground shadow-[inset_0_-1px_0_rgba(2,6,23,0.06)]">
            {children}
        </kbd>
    );
}

export function KeyboardShortcutsSheet({
    open,
    onClose,
}: KeyboardShortcutsSheetProps) {
    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.button
                        type="button"
                        aria-label="Close keyboard shortcuts"
                        className="fixed inset-0 z-[9998] cursor-default bg-black/68 backdrop-blur-[1px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        onClick={onClose}
                    />
                    <motion.section
                        data-testid="keyboard-shortcuts-sheet"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="keyboard-shortcuts-title"
                        className="fixed inset-x-0 bottom-0 z-[9999] max-h-[78dvh] overflow-y-auto rounded-t-[28px] border border-border bg-background px-6 pb-10 pt-6 shadow-[0_-24px_80px_rgba(2,6,23,0.18)] sm:px-10 lg:px-16"
                        initial={{ y: "100%", opacity: 0.96 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0.96 }}
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="mx-auto max-w-6xl">
                            <div className="mb-12 flex items-center justify-between gap-6">
                                <h2
                                    id="keyboard-shortcuts-title"
                                    className="font-space-grotesk text-3xl font-[560] tracking-[-0.04em] text-foreground"
                                >
                                    Keyboard Shortcuts
                                </h2>
                                <button
                                    type="button"
                                    data-testid="keyboard-shortcuts-close"
                                    onClick={onClose}
                                    className="rounded-full p-2 text-muted-foreground transition-[background-color,color] duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                                    aria-label="Close shortcuts"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <div className="grid gap-10 sm:grid-cols-2 xl:grid-cols-4">
                                {shortcutGroups.map((group) => (
                                    <div key={group.title}>
                                        <h3 className="mb-7 font-space-grotesk text-xs font-[560] uppercase tracking-[0.18em] text-muted-foreground">
                                            {group.title}
                                        </h3>
                                        <div className="space-y-6">
                                            {group.items.map((item) => (
                                                <div
                                                    key={item.label}
                                                    className="flex items-center justify-between gap-5"
                                                >
                                                    <span className="text-sm text-foreground">
                                                        {item.label}
                                                    </span>
                                                    <span className="flex shrink-0 items-center gap-1.5">
                                                        {item.keys.map((key) => (
                                                            <Keycap key={key}>{key}</Keycap>
                                                        ))}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.section>
                </>
            )}
        </AnimatePresence>
    );
}
