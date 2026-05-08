"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { AuthShell } from "@/app/components/auth/AuthShell";

export default function LoginPage() {
    const router = useRouter();
    const { isAuthenticated, authLoading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            router.replace("/assistant");
        }
    }, [authLoading, isAuthenticated, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            router.push("/assistant");
        } catch (error: any) {
            setError(error.message || "An error occurred during login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            mode="login"
            title="Welcome back"
            subtitle="Sign in to continue working with your projects, reviews, and workflows."
            showGuestOption
        >
            <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium text-foreground"
                    >
                        Email
                    </label>
                    <Input
                        id="email"
                        data-testid="login-email-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        required
                        className="h-11"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-foreground"
                        >
                            Password
                        </label>
                        <span className="text-xs text-muted-foreground">
                            Secure access
                        </span>
                    </div>
                    <Input
                        id="password"
                        data-testid="login-password-input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="h-11"
                    />
                </div>

                {error && (
                    <div
                        data-testid="login-error-banner"
                        className="rounded-xl border border-border bg-muted/45 px-4 py-3 text-sm text-foreground"
                    >
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    data-testid="login-submit-button"
                    disabled={loading}
                    loading={loading}
                    className="h-11 w-full font-space-grotesk"
                >
                    {loading ? "Logging in" : "Log in"}
                </Button>
            </form>

            <div className="mt-6 border-t border-border/70 pt-5 text-center text-sm text-muted-foreground">
                New to Open Specter?{" "}
                <Link
                    href="/signup"
                    className="font-space-grotesk font-medium text-foreground underline-offset-4 hover:underline"
                >
                    Create an account
                </Link>
            </div>
        </AuthShell>
    );
}
