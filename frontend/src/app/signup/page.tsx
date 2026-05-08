"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthShell } from "@/app/components/auth/AuthShell";

export default function SignupPage() {
    const router = useRouter();
    const { isAuthenticated, authLoading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [organisation, setOrganisation] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!authLoading && isAuthenticated && !success) {
            router.replace("/assistant");
        }
    }, [authLoading, isAuthenticated, router, success]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            if (data.session) {
                const trimmedName = name.trim();
                const trimmedOrg = organisation.trim();
                if (trimmedName || trimmedOrg) {
                    const { error: profileError } = await supabase
                        .from("user_profiles")
                        .update({
                            ...(trimmedName && { display_name: trimmedName }),
                            ...(trimmedOrg && { organisation: trimmedOrg }),
                            updated_at: new Date().toISOString(),
                        })
                        .eq("user_id", data.session.user.id);
                    if (profileError) {
                        console.error(
                            "[signup] failed to persist profile fields",
                            profileError,
                        );
                    }
                }
            }
            setSuccess(true);
            setTimeout(() => {
                router.push("/assistant");
            }, 2000);
        } catch (error: any) {
            setError(error.message || "An error occurred during signup");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <AuthShell
                mode="signup"
                title="Account created"
                subtitle="Your workspace is ready. Redirecting you to Open Specter."
            >
                <div
                    data-testid="signup-success-panel"
                    className="rounded-2xl border border-border bg-muted/40 p-6 text-center"
                >
                    <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-background text-foreground shadow-sm">
                        <CheckCircle2 className="size-5" />
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Your account was created successfully. You will be taken to the assistant shortly.
                    </p>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            mode="signup"
            title="Create your workspace"
            subtitle="Start with a private Open Specter account for legal document analysis."
        >
            <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <label htmlFor="name" className="block text-sm font-medium text-foreground">
                            Name <span className="font-normal text-muted-foreground">optional</span>
                        </label>
                        <Input
                            id="name"
                            data-testid="signup-name-input"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="organisation" className="block text-sm font-medium text-foreground">
                            Organisation <span className="font-normal text-muted-foreground">optional</span>
                        </label>
                        <Input
                            id="organisation"
                            data-testid="signup-organisation-input"
                            type="text"
                            value={organisation}
                            onChange={(e) => setOrganisation(e.target.value)}
                            placeholder="Firm or company"
                            className="h-11"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-foreground">
                        Email
                    </label>
                    <Input
                        id="email"
                        data-testid="signup-email-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        required
                        className="h-11"
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-medium text-foreground">
                            Password
                        </label>
                        <Input
                            id="password"
                            data-testid="signup-password-input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Minimum 6 characters"
                            required
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                            Confirm password
                        </label>
                        <Input
                            id="confirmPassword"
                            data-testid="signup-confirm-password-input"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat password"
                            required
                            className="h-11"
                        />
                    </div>
                </div>

                {error && (
                    <div
                        data-testid="signup-error-banner"
                        className="rounded-xl border border-border bg-muted/45 px-4 py-3 text-sm text-foreground"
                    >
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    data-testid="signup-submit-button"
                    disabled={loading}
                    loading={loading}
                    className="h-11 w-full font-space-grotesk"
                >
                    {loading ? "Creating account" : "Create account"}
                </Button>
            </form>

            <div className="mt-5 text-center text-xs leading-5 text-muted-foreground">
                By signing up, you agree to our{" "}
                <Link
                    href="https://openspecter.com/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline-offset-4 hover:underline"
                >
                    Terms
                </Link>{" "}
                and{" "}
                <Link
                    href="https://openspecter.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline-offset-4 hover:underline"
                >
                    Privacy Policy
                </Link>
                .
            </div>
        </AuthShell>
    );
}
