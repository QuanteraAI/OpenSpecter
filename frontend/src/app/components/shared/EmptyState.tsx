"use client";

import { Plus, Table2, FolderOpen, Library, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    icon: "projects" | "tabular" | "workflows" | "search";
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    actionDisabled?: boolean;
    actionTestId?: string;
    loading?: boolean;
}

const iconMap = {
    projects: FolderOpen,
    tabular: Table2,
    workflows: Library,
    search: Search,
};

export function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    actionDisabled,
    actionTestId,
    loading,
}: EmptyStateProps) {
    const Icon = iconMap[icon];

    return (
        <div className="flex min-h-[52vh] w-full items-center justify-center px-6 py-16 text-center">
            <div className="mx-auto flex max-w-[460px] flex-col items-center">
                <div className="mb-8 flex size-16 items-center justify-center rounded-2xl border border-border/60 bg-muted/40 text-foreground/75 shadow-[0_12px_34px_rgba(2,6,23,0.045)]">
                    <Icon className="size-7" strokeWidth={1.65} />
                </div>
                <h2 className="font-space-grotesk text-4xl font-[560] tracking-[-0.055em] text-foreground">
                    {title}
                </h2>
                <p className="mt-4 max-w-[420px] text-base leading-7 text-muted-foreground">
                    {description}
                </p>
                {actionLabel && onAction && (
                    <Button
                        type="button"
                        onClick={onAction}
                        disabled={actionDisabled || loading}
                        loading={loading}
                        className="mt-9 h-12 min-w-[210px] rounded-xl px-6 font-space-grotesk text-base"
                        data-testid={actionTestId}
                    >
                        {!loading && <Plus className="size-4" />}
                        {actionLabel}
                    </Button>
                )}
            </div>
        </div>
    );
}
