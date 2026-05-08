"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { KeyRound, Loader2, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface TabDef {
    id: string;
    label: string;
    description: string;
    href: string;
    icon: typeof Settings;
}

const TABS: TabDef[] = [
    {
        id: "general",
        label: "General",
        description: "Profile, plan, and account controls",
        href: "/account",
        icon: Settings,
    },
    {
        id: "models",
        label: "Models & API keys",
        description: "Model preferences and provider credentials",
        href: "/account/models",
        icon: KeyRound,
    },
];

export default function AccountLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/");
        }
    }, [isAuthenticated, authLoading, router]);

    if (authLoading) {
        return (
            <div className="flex h-dvh items-center justify-center bg-background">
                <Loader2 className="size-7 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="h-full overflow-y-auto bg-background px-4 py-6 sm:px-6 md:py-10">
            <div className="mx-auto w-full max-w-6xl">
                <div className="mb-8">
                    <p className="font-space-grotesk text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        Open Specter
                    </p>
                    <h1 className="mt-2 font-space-grotesk text-4xl font-[560] tracking-[-0.035em] text-foreground">
                        Settings
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Manage your workspace identity, model preferences, and account access.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
                    <nav
                        aria-label="Settings"
                        className="h-fit rounded-2xl border border-border/70 bg-card p-2 shadow-[0_10px_30px_rgba(2,6,23,0.035)]"
                    >
                        {TABS.map((tab) => {
                            const active = pathname === tab.href;
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    data-testid={`settings-nav-${tab.id}`}
                                    onClick={() => router.push(tab.href)}
                                    className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-[background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 ${
                                        active
                                            ? "bg-muted text-foreground"
                                            : "text-muted-foreground hover:bg-muted/55 hover:text-foreground"
                                    }`}
                                >
                                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-foreground/75 shadow-sm">
                                        <Icon className="size-4" />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block font-space-grotesk text-sm font-[550]">
                                            {tab.label}
                                        </span>
                                        <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">
                                            {tab.description}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </nav>

                    <div className="min-w-0">{children}</div>
                </div>
            </div>
        </div>
    );
}
