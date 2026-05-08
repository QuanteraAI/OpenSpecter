"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock3, MessageSquareText, Table2, Workflow } from "lucide-react";

import { listRecentActivity, type RecentActivityEvent } from "@/app/lib/openSpecterApi";

const eventConfig = {
    assistant_chat_created: {
        label: "Assistant chat",
        action: "Started chat",
        icon: MessageSquareText,
    },
    tabular_review_created: {
        label: "Tabular review",
        action: "Created review",
        icon: Table2,
    },
    workflow_used: {
        label: "Workflow",
        action: "Used workflow",
        icon: Workflow,
    },
} satisfies Record<RecentActivityEvent["event_type"], { label: string; action: string; icon: typeof MessageSquareText }>;

function formatDate(value: string) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "";
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
    }).format(date);
}

function ActivitySkeleton() {
    return (
        <div aria-hidden="true" className="space-y-4 pt-7">
            {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-start gap-5 rounded-2xl px-5 py-5">
                    <div className="size-8 animate-pulse rounded-lg bg-muted" />
                    <div className="min-w-0 flex-1 space-y-3">
                        <div className="h-4 w-52 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-64 max-w-full animate-pulse rounded bg-muted/80" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function RecentActivity() {
    const [events, setEvents] = useState<RecentActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listRecentActivity(10);
            setEvents(data);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Unable to load recent activity";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const hasSchemaError = useMemo(
        () => error?.includes("activity_events") || error?.includes("schema cache"),
        [error],
    );

    return (
        <section
            data-testid="recent-activity-section"
            className="mt-9"
        >
            <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="font-space-grotesk text-2xl font-[560] tracking-[-0.035em] text-foreground sm:text-3xl">
                    Recent activity
                </h2>
            </div>

            <div className="border-t border-border/70 pt-4">
                {loading ? (
                    <ActivitySkeleton />
                ) : error ? (
                    <div className="rounded-2xl bg-muted/35 px-5 py-5 text-sm text-muted-foreground">
                        <p className="font-space-grotesk font-[550] text-foreground">
                            Recent activity is waiting for the database schema.
                        </p>
                        <p className="mt-1 max-w-2xl text-xs leading-relaxed">
                            {hasSchemaError
                                ? "Apply the Open Specter Supabase schema to enable real activity history."
                                : "We couldn’t load recent activity right now."}
                        </p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="rounded-2xl bg-muted/35 px-5 py-5 text-sm text-muted-foreground">
                        <p className="font-space-grotesk font-[550] text-foreground">No recent activity yet</p>
                        <p className="mt-1 text-xs">
                            Start a chat, create a tabular review, or run a workflow and it will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {events.map((event, index) => {
                            const config = eventConfig[event.event_type];
                            const Icon = config.icon;
                            const row = (
                                <div
                                    className={`flex items-start gap-5 rounded-2xl px-5 py-5 transition-[background-color] duration-150 hover:bg-muted/45 active:bg-muted/60 ${
                                        index === 0 ? "bg-muted/35" : ""
                                    }`}
                                >
                                    <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground/75">
                                        <Icon className="size-5" strokeWidth={1.7} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-space-grotesk text-lg font-[520] tracking-[-0.025em] text-foreground">
                                            {event.title || config.label}
                                        </p>
                                        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock3 className="size-4" strokeWidth={1.7} />
                                            <span>{formatDate(event.created_at)}</span>
                                            <span aria-hidden="true">•</span>
                                            <span>{config.action}</span>
                                        </p>
                                    </div>
                                </div>
                            );

                            return event.entity_url ? (
                                <Link
                                    key={event.id}
                                    href={event.entity_url}
                                    data-testid={`recent-activity-row-${event.id}`}
                                    className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                                >
                                    {row}
                                </Link>
                            ) : (
                                <div key={event.id} data-testid={`recent-activity-row-${event.id}`}>
                                    {row}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
