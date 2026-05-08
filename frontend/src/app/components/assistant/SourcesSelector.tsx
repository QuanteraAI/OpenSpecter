"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { BookOpen, Check, Globe2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    fetchLegalCountries,
    COUNTRY_NAMES,
    type LegalCountry,
} from "@/app/lib/legalDataApi";

export type SourcesNamespace = "all" | "case_law" | "legislation" | "doctrine";

export interface SourcesSelection {
    country: string;
    namespace: SourcesNamespace;
}

interface Props {
    value: SourcesSelection | null;
    onChange: (next: SourcesSelection | null) => void;
}

const NAMESPACE_OPTIONS: Array<{ id: SourcesNamespace; label: string }> = [
    { id: "all", label: "All" },
    { id: "case_law", label: "Case law" },
    { id: "legislation", label: "Legislation" },
    { id: "doctrine", label: "Doctrine" },
];

function formatCount(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
    return String(n);
}

export function SourcesSelector({ value, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const [countries, setCountries] = useState<LegalCountry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [pendingNamespace, setPendingNamespace] = useState<SourcesNamespace>(
        value?.namespace ?? "all",
    );
    const popoverRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState<
        | { mode: "above"; bottom: number; left: number }
        | { mode: "below"; top: number; left: number }
        | null
    >(null);

    const computePosition = () => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (!rect) return null;
        const POPOVER_WIDTH = 340;
        const SAFE_PADDING = 12;
        const left = Math.max(
            SAFE_PADDING,
            Math.min(
                rect.left,
                window.innerWidth - POPOVER_WIDTH - SAFE_PADDING,
            ),
        );
        // Decide above/below by which side has more room. Anchor to the
        // adjacent edge so the popover bottom (or top) sits 8px from the
        // trigger regardless of content height.
        const spaceAbove = rect.top - SAFE_PADDING;
        const spaceBelow = window.innerHeight - rect.bottom - SAFE_PADDING;
        if (spaceBelow > spaceAbove) {
            return {
                mode: "below" as const,
                top: rect.bottom + 8,
                left,
            };
        }
        return {
            mode: "above" as const,
            bottom: window.innerHeight - rect.top + 8,
            left,
        };
    };

    // Reposition on resize/scroll while open.
    useEffect(() => {
        if (!open) return;
        const update = () => setPosition(computePosition());
        window.addEventListener("resize", update);
        window.addEventListener("scroll", update, true);
        return () => {
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update, true);
        };
    }, [open]);

    // Load countries on first open.
    useEffect(() => {
        if (!open || countries.length > 0 || loading) return;
        setLoading(true);
        setError(null);
        fetchLegalCountries()
            .then((list) => {
                // Sort by total_documents descending.
                setCountries([...list].sort((a, b) => b.total_documents - a.total_documents));
            })
            .catch((e) => setError(e.message ?? "Failed to load countries"))
            .finally(() => setLoading(false));
    }, [open, countries.length, loading]);

    // Close on outside click.
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(e.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return countries;
        return countries.filter((c) => {
            const name = (COUNTRY_NAMES[c.code] ?? c.code).toLowerCase();
            return name.includes(q) || c.code.toLowerCase().includes(q);
        });
    }, [countries, search]);

    const handlePickCountry = (code: string) => {
        onChange({ country: code, namespace: pendingNamespace });
        setOpen(false);
        setSearch("");
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
    };

    const displayLabel = value
        ? `${COUNTRY_NAMES[value.country] ?? value.country}${value.namespace !== "all" ? ` · ${value.namespace.replace("_", " ")}` : ""}`
        : "Sources";

    return (
        <div className="relative inline-block">
            <Button
                ref={triggerRef}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                    setOpen((v) => {
                        const next = !v;
                        if (next) setPosition(computePosition());
                        return next;
                    });
                }}
                aria-label="Open legal sources selector"
                aria-expanded={open}
                data-testid="assistant-prompt-sources-button"
                className={
                    value
                        ? "h-8 max-w-[240px] bg-muted font-space-grotesk text-sm font-[520] text-foreground transition-[background-color,color] duration-150 hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring/35"
                        : "h-8 font-space-grotesk text-sm font-[520] text-muted-foreground transition-[background-color,color] duration-150 hover:bg-muted/65 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/35"
                }
            >
                {value ? <Check className="size-3.5" /> : <BookOpen className="size-3.5" />}
                <span className="hidden truncate sm:inline">{displayLabel}</span>
                {value && (
                    <span
                        role="button"
                        aria-label="Clear sources"
                        data-testid="assistant-prompt-sources-clear"
                        onClick={handleClear}
                        className="ml-0.5 inline-flex rounded-full p-0.5 text-muted-foreground transition-[background-color,color] duration-150 hover:bg-background hover:text-foreground"
                    >
                        <X className="size-3" />
                    </span>
                )}
            </Button>

            {open && position && typeof document !== "undefined" &&
                createPortal(
                    <motion.div
                        ref={popoverRef}
                        data-testid="assistant-prompt-sources-popover"
                        initial={{ opacity: 0, y: position.mode === "above" ? 8 : -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                        style={
                            position.mode === "above"
                                ? {
                                    position: "fixed",
                                    bottom: position.bottom,
                                    left: position.left,
                                    width: 340,
                                    zIndex: 2147483647,
                                }
                                : {
                                    position: "fixed",
                                    top: position.top,
                                    left: position.left,
                                    width: 340,
                                    zIndex: 2147483647,
                                }
                        }
                        className="overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-[0_20px_60px_rgba(2,6,23,0.18)] backdrop-blur-md"
                    >
                        {/* Header: Globe + title */}
                        <div className="flex items-center gap-2.5 border-b border-border/60 px-4 py-3">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                                <Globe2 className="size-3.5" />
                            </div>
                            <p className="font-space-grotesk text-sm font-[560] text-foreground">
                                Legal research sources
                            </p>
                        </div>

                        {/* Namespace segmented tabs */}
                        <div
                            role="tablist"
                            aria-label="Document type"
                            className="flex items-center gap-1 border-b border-border/60 px-3 py-2"
                        >
                            {NAMESPACE_OPTIONS.map((opt) => {
                                const isActive = pendingNamespace === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        data-testid={`sources-namespace-${opt.id}`}
                                        onClick={() => setPendingNamespace(opt.id)}
                                        className={`flex-1 rounded-full border px-2.5 py-1 text-[11px] font-[520] font-space-grotesk tracking-[-0.005em] transition-[background-color,color,border-color] duration-150 ${
                                            isActive
                                                ? "border-gray-900 bg-gray-900 text-white shadow-[0_4px_10px_rgba(2,6,23,0.12)]"
                                                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search */}
                        <div className="px-3 py-2">
                            <div className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5">
                                <Search className="h-3 w-3 text-gray-400 shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Search 178 countries…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    data-testid="sources-country-search"
                                    className="flex-1 bg-transparent text-xs text-gray-700 placeholder:text-gray-400 outline-none"
                                    autoFocus
                                />
                                {search && (
                                    <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Country list */}
                        <div
                            data-testid="sources-country-list"
                            className="max-h-[240px] overflow-y-auto"
                        >
                            {loading && (
                                <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                                    Loading countries…
                                </p>
                            )}
                            {error && (
                                <p
                                    data-testid="sources-error"
                                    className="px-4 py-4 text-center text-xs text-foreground"
                                >
                                    {error}
                                </p>
                            )}
                            {!loading && !error && filtered.length === 0 && (
                                <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                                    No countries match &ldquo;{search}&rdquo;
                                </p>
                            )}
                            {filtered.map((c) => {
                                const name = COUNTRY_NAMES[c.code] ?? c.code;
                                const isSelected = value?.country === c.code;
                                return (
                                    <button
                                        key={c.code}
                                        type="button"
                                        data-testid={`sources-country-${c.code}`}
                                        onClick={() => handlePickCountry(c.code)}
                                        className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-xs transition-colors ${
                                            isSelected
                                                ? "bg-gray-100 text-gray-900"
                                                : "text-gray-700 hover:bg-gray-50"
                                        }`}
                                    >
                                        <span className="flex min-w-0 items-center gap-2">
                                            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-md bg-muted font-space-grotesk text-[9px] font-[600] uppercase tracking-wide text-muted-foreground">
                                                {c.code.slice(0, 3)}
                                            </span>
                                            <span className="truncate">{name}</span>
                                        </span>
                                        <span className="shrink-0 text-[10px] font-medium text-muted-foreground tabular-nums">
                                            {formatCount(c.total_documents)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>,
                    document.body,
                )}
        </div>
    );
}
