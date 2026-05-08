"use client";

import { motion } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import { OpenSpecterIcon } from "@/components/chat/open-specter-icon";

interface AuthShellProps {
    mode: "login" | "signup";
    title: string;
    subtitle: string;
    children: React.ReactNode;
}

export function AuthShell({ mode, title, subtitle, children }: AuthShellProps) {
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
                        <div className="inline-flex rounded-full border border-border bg-background/80 p-1 text-xs font-medium text-muted-foreground shadow-sm">
                            <Link
                                href="/login"
                                data-testid={mode === "login" ? "login-current-tab" : "signup-switch-to-login"}
                                className={`rounded-full px-3 py-1.5 transition-[background-color,color,box-shadow] duration-150 ${
                                    mode === "login"
                                        ? "bg-foreground text-background shadow-sm"
                                        : "hover:bg-muted hover:text-foreground"
                                }`}
                            >
                                Log in
                            </Link>
                            <Link
                                href="/signup"
                                data-testid={mode === "signup" ? "signup-current-tab" : "login-switch-to-signup"}
                                className={`rounded-full px-3 py-1.5 transition-[background-color,color,box-shadow] duration-150 ${
                                    mode === "signup"
                                        ? "bg-foreground text-background shadow-sm"
                                        : "hover:bg-muted hover:text-foreground"
                                }`}
                            >
                                Sign up
                            </Link>
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
