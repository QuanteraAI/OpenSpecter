"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import { OpenSpecterIcon } from "@/components/chat/open-specter-icon";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface AuthShellProps {
    mode: "login" | "signup";
    title: string;
    subtitle: string;
    children: React.ReactNode;
    /** When true, renders the "Continue as guest" CTA below the form. */
    showGuestOption?: boolean;
}

const AUTH_TABS: Array<{ id: "login" | "signup"; label: string; href: string }> = [
    { id: "login", label: "Log in", href: "/login" },
    { id: "signup", label: "Sign up", href: "/signup" },
];

export function AuthShell({ mode, title, subtitle, children, showGuestOption = false }: AuthShellProps) {
    const prefersReducedMotion = useReducedMotion();
    const router = useRouter();
    const { signInAsGuest } = useAuth();
    const [guestLoading, setGuestLoading] = useState(false);
    const [guestError, setGuestError] = useState<string | null>(null);

    const handleContinueAsGuest = async () => {
        setGuestLoading(true);
        setGuestError(null);
        const { error } = await signInAsGuest();
        if (error) {
            setGuestError(error);
            setGuestLoading(false);
            return;
        }
        router.push("/assistant");
    };

    return (
        <main className="min-h-dvh bg-background p-2 text-foreground sm:p-3">
            <motion.div
                className="grid min-h-[calc(100dvh-1rem)] overflow-hidden rounded-[28px] border border-border/70 bg-background shadow-[0_24px_80px_rgba(2,6,23,0.06)] lg:grid-cols-[minmax(520px,1fr)_minmax(520px,1fr)] sm:min-h-[calc(100dvh-1.5rem)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
                <section className="relative flex min-h-[calc(100dvh-1rem)] flex-col bg-[#fbfbfa] px-6 py-6 sm:min-h-[calc(100dvh-1.5rem)] sm:px-10 lg:px-16">
                    <div className="flex items-center justify-end gap-4">
                        <div
                            role="tablist"
                            aria-label="Authentication mode"
                            data-testid="auth-tabs-list"
                            className="inline-flex items-center gap-1 rounded-2xl border border-gray-200 bg-gray-50/90 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(2,6,23,0.04)]"
                        >
                            {AUTH_TABS.map((tab) => {
                                const isActive = mode === tab.id;
                                return (
                                    <motion.div
                                        key={tab.id}
                                        whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                                        whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                                        transition={{ duration: 0.16, ease: "easeOut" }}
                                        className="relative"
                                    >
                                        <Link
                                            href={tab.href}
                                            role="tab"
                                            aria-selected={isActive}
                                            data-testid={
                                                isActive
                                                    ? `${tab.id}-current-tab`
                                                    : tab.id === "login"
                                                        ? "signup-switch-to-login"
                                                        : "login-switch-to-signup"
                                            }
                                            className={cn(
                                                "relative block min-h-9 whitespace-nowrap rounded-xl px-4 py-2 font-space-grotesk text-sm font-[520] tracking-[-0.01em] outline-none transition-[color] duration-150 focus-visible:ring-2 focus-visible:ring-ring/35",
                                                isActive
                                                    ? "text-gray-950"
                                                    : "text-gray-500 hover:text-gray-800",
                                            )}
                                        >
                                            {isActive && (
                                                <motion.span
                                                    layoutId="auth-tabs-active-pill"
                                                    className="absolute inset-0 rounded-xl border border-gray-200 bg-white shadow-[0_6px_18px_rgba(2,6,23,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]"
                                                    transition={{
                                                        duration: prefersReducedMotion ? 0 : 0.22,
                                                        ease: [0.22, 1, 0.36, 1],
                                                    }}
                                                />
                                            )}
                                            <span className="relative z-10">{tab.label}</span>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex flex-1 flex-col items-center justify-center py-12">
                        <motion.div
                            className="w-full max-w-[430px]"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
                        >
                            <div className="mb-14 text-center">
                                <div className="mb-5 flex justify-center">
                                    <OpenSpecterIcon size={30} />
                                </div>
                                <h1 className="font-space-grotesk text-4xl font-[540] tracking-[-0.055em] text-foreground sm:text-[2.65rem]">
                                    Open Specter
                                </h1>
                                <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
                                    {subtitle}
                                </p>
                            </div>

                            <div>
                                <div className="mb-5">
                                    <h2 className="font-space-grotesk text-xl font-[560] tracking-[-0.025em] text-foreground">
                                        {title}
                                    </h2>
                                </div>
                                {children}

                                {showGuestOption && (
                                    <>
                                        <div className="mt-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
                                            <span className="h-px flex-1 bg-border/70" />
                                            <span>or</span>
                                            <span className="h-px flex-1 bg-border/70" />
                                        </div>

                                        <button
                                            type="button"
                                            data-testid="auth-continue-as-guest-button"
                                            onClick={handleContinueAsGuest}
                                            disabled={guestLoading}
                                            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border/80 bg-background font-space-grotesk text-sm font-[520] tracking-[-0.005em] text-foreground transition-[background-color,border-color,box-shadow,transform] duration-150 hover:border-foreground/20 hover:bg-muted/45 hover:shadow-[0_8px_24px_rgba(2,6,23,0.05)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-ring/35"
                                        >
                                            {guestLoading ? "Setting up your guest workspace…" : "Continue as guest"}
                                        </button>
                                        <p className="mt-2 text-center text-xs leading-5 text-muted-foreground/80">
                                            Skip sign-up. Add an email later to keep your work permanently.
                                        </p>
                                        {guestError && (
                                            <p
                                                data-testid="auth-guest-error"
                                                className="mt-3 rounded-xl border border-border bg-muted/45 px-4 py-3 text-center text-sm text-foreground"
                                            >
                                                {guestError}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    <div className="mx-auto w-full max-w-[430px] pb-2" aria-hidden="true" />
                </section>

                <section className="relative hidden min-h-full overflow-hidden rounded-[24px] lg:block">
                    <Image
                        src="/auth/login-visual.jpeg"
                        alt="Open Specter workspace visual"
                        fill
                        priority
                        sizes="50vw"
                        className="select-none object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-black/10" />
                </section>
            </motion.div>
        </main>
    );
}
