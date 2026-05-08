"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Check, LogOut, Shield, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { deleteAccount } from "@/app/lib/openSpecterApi";
import { supabase } from "@/lib/supabase";

function SettingsCard({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-border/70 bg-card shadow-[0_10px_30px_rgba(2,6,23,0.035)]">
            <div className="border-b border-border/60 px-5 py-4 sm:px-6">
                <h2 className="font-space-grotesk text-lg font-[560] tracking-[-0.02em] text-foreground">
                    {title}
                </h2>
                {description && (
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            <div className="divide-y divide-border/60">{children}</div>
        </section>
    );
}

function FieldRow({
    label,
    description,
    children,
}: {
    label: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-3 px-5 py-5 sm:px-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
            <div>
                <label className="font-space-grotesk text-sm font-[550] text-foreground">
                    {label}
                </label>
                {description && (
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {children}
        </div>
    );
}

export default function AccountPage() {
    const router = useRouter();
    const { user, signOut, isAnonymous } = useAuth();
    const { profile, updateDisplayName, updateOrganisation } = useUserProfile();
    const [displayName, setDisplayName] = useState("");
    const [isSavingName, setIsSavingName] = useState(false);
    const [saved, setSaved] = useState(false);
    const [organisation, setOrganisation] = useState("");
    const [isSavingOrg, setIsSavingOrg] = useState(false);
    const [orgSaved, setOrgSaved] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Upgrade-to-permanent flow state
    const [upgradeEmail, setUpgradeEmail] = useState("");
    const [upgradePassword, setUpgradePassword] = useState("");
    const [upgradeConfirm, setUpgradeConfirm] = useState("");
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [upgradeError, setUpgradeError] = useState<string | null>(null);
    const [upgradeSuccess, setUpgradeSuccess] = useState(false);

    useEffect(() => {
        if (profile?.displayName) setDisplayName(profile.displayName);
        if (profile?.organisation) setOrganisation(profile.organisation);
    }, [profile]);

    const handleLogout = async () => {
        await signOut();
        router.push("/");
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await deleteAccount();
            await signOut();
            router.push("/");
        } catch {
            setIsDeleting(false);
            setDeleteConfirm(false);
            alert("Failed to delete account. Please try again.");
        }
    };

    const handleSaveDisplayName = async () => {
        setIsSavingName(true);
        const success = await updateDisplayName(displayName.trim());
        setIsSavingName(false);
        if (success) {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } else {
            alert("Failed to update display name. Please try again.");
        }
    };

    const handleSaveOrganisation = async () => {
        setIsSavingOrg(true);
        const success = await updateOrganisation(organisation.trim());
        setIsSavingOrg(false);
        if (success) {
            setOrgSaved(true);
            setTimeout(() => setOrgSaved(false), 2000);
        } else {
            alert("Failed to update organisation. Please try again.");
        }
    };

    const handleUpgradeAccount = async () => {
        setUpgradeError(null);

        const email = upgradeEmail.trim();
        if (!email) {
            setUpgradeError("Email is required.");
            return;
        }
        if (upgradePassword.length < 6) {
            setUpgradeError("Password must be at least 6 characters.");
            return;
        }
        if (upgradePassword !== upgradeConfirm) {
            setUpgradeError("Passwords do not match.");
            return;
        }

        setIsUpgrading(true);
        try {
            // Link email + password to the current anonymous user.
            // Supabase will keep the same user.id and convert is_anonymous to false.
            // If "Confirm email" is enabled in your project, Supabase will email a
            // verification link; the user can keep using the app meanwhile.
            const { error } = await supabase.auth.updateUser({
                email,
                password: upgradePassword,
            });
            if (error) throw error;

            setUpgradeSuccess(true);
            setUpgradeEmail("");
            setUpgradePassword("");
            setUpgradeConfirm("");
        } catch (err: any) {
            setUpgradeError(
                err?.message ||
                    "Could not upgrade account. Please try again or use a different email.",
            );
        } finally {
            setIsUpgrading(false);
        }
    };

    if (!user) return null;

    return (
        <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
            {isAnonymous && (
                <SettingsCard
                    title="Save your guest account"
                    description="Add an email and password so you don't lose your projects, reviews, and chats."
                >
                    <div className="px-5 py-5 sm:px-6">
                        {upgradeSuccess ? (
                            <div
                                data-testid="settings-upgrade-success-panel"
                                className="rounded-2xl border border-border bg-muted/40 p-5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-full bg-background text-foreground shadow-sm">
                                        <Check className="size-5" />
                                    </div>
                                    <div>
                                        <p className="font-space-grotesk text-sm font-[560] text-foreground">
                                            Account saved
                                        </p>
                                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                            Check your inbox to verify the email. You can keep working — your projects, reviews, and chats are all linked to your new account.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-border/70 bg-muted/30 p-5">
                                <div className="mb-4 flex items-start gap-3">
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-background text-foreground shadow-sm">
                                        <Sparkles className="size-4" />
                                    </div>
                                    <div>
                                        <p className="font-space-grotesk text-sm font-[560] text-foreground">
                                            You're using Open Specter as a guest
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                            Your work is saved on this device but anonymous accounts can be removed without notice. Add an email to keep everything permanently.
                                        </p>
                                    </div>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label className="mb-1.5 block text-xs font-medium text-foreground">
                                            Email
                                        </label>
                                        <Input
                                            data-testid="settings-upgrade-email-input"
                                            type="email"
                                            value={upgradeEmail}
                                            onChange={(e) =>
                                                setUpgradeEmail(e.target.value)
                                            }
                                            placeholder="name@company.com"
                                            className="h-11"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-foreground">
                                            Password
                                        </label>
                                        <Input
                                            data-testid="settings-upgrade-password-input"
                                            type="password"
                                            value={upgradePassword}
                                            onChange={(e) =>
                                                setUpgradePassword(e.target.value)
                                            }
                                            placeholder="Min. 6 characters"
                                            className="h-11"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-foreground">
                                            Confirm password
                                        </label>
                                        <Input
                                            data-testid="settings-upgrade-confirm-input"
                                            type="password"
                                            value={upgradeConfirm}
                                            onChange={(e) =>
                                                setUpgradeConfirm(e.target.value)
                                            }
                                            placeholder="Repeat password"
                                            className="h-11"
                                        />
                                    </div>
                                </div>
                                {upgradeError && (
                                    <p
                                        data-testid="settings-upgrade-error"
                                        className="mt-3 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground"
                                    >
                                        {upgradeError}
                                    </p>
                                )}
                                <div className="mt-4 flex justify-end">
                                    <Button
                                        data-testid="settings-upgrade-submit-button"
                                        onClick={handleUpgradeAccount}
                                        disabled={isUpgrading}
                                        loading={isUpgrading}
                                        className="h-10 font-space-grotesk"
                                    >
                                        {isUpgrading
                                            ? "Saving"
                                            : "Save my account"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </SettingsCard>
            )}

            <SettingsCard
                title="General"
                description="Keep your profile details current for a consistent workspace experience."
            >
                <FieldRow label="Display name" description="Shown in the app shell and activity surfaces.">
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                            data-testid="settings-display-name-input"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your name"
                            className="h-10 flex-1"
                        />
                        <Button
                            data-testid="settings-save-display-name-button"
                            onClick={handleSaveDisplayName}
                            disabled={isSavingName || !displayName.trim() || saved}
                            loading={isSavingName}
                            className="h-10 min-w-[92px] font-space-grotesk"
                        >
                            {saved ? (
                                <><Check className="size-4" /> Saved</>
                            ) : (
                                "Save"
                            )}
                        </Button>
                    </div>
                </FieldRow>

                <FieldRow label="Organisation" description="Optional company, firm, or team name.">
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                            data-testid="settings-organisation-input"
                            type="text"
                            value={organisation}
                            onChange={(e) => setOrganisation(e.target.value)}
                            placeholder="Enter your organisation"
                            className="h-10 flex-1"
                        />
                        <Button
                            data-testid="settings-save-organisation-button"
                            onClick={handleSaveOrganisation}
                            disabled={
                                isSavingOrg ||
                                organisation.trim() === (profile?.organisation ?? "") ||
                                orgSaved
                            }
                            loading={isSavingOrg}
                            className="h-10 min-w-[92px] font-space-grotesk"
                        >
                            {orgSaved ? (
                                <><Check className="size-4" /> Saved</>
                            ) : (
                                "Save"
                            )}
                        </Button>
                    </div>
                </FieldRow>

                <FieldRow label="Email" description="Your sign-in identity.">
                    <div className="rounded-xl border border-border bg-muted/35 px-3 py-2 text-sm text-foreground">
                        {isAnonymous
                            ? "Guest session — add an email above to claim your account"
                            : user.email}
                    </div>
                </FieldRow>
            </SettingsCard>

            <SettingsCard title="Plan" description="Your current usage tier.">
                <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground/80">
                            <Shield className="size-4" />
                        </div>
                        <div>
                            <p className="font-space-grotesk text-sm font-[550] text-foreground">
                                Usage plan
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Upgrade options will appear here when available.
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                        {profile?.tier || "Free"}
                    </Badge>
                </div>
            </SettingsCard>

            <SettingsCard title="Session" description="Manage access from this browser.">
                <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground/80">
                            <UserRound className="size-4" />
                        </div>
                        <div>
                            <p className="font-space-grotesk text-sm font-[550] text-foreground">
                                Signed in as {profile?.displayName || user.email}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Sign out when working on a shared device.
                            </p>
                        </div>
                    </div>
                    <Button
                        data-testid="settings-sign-out-button"
                        variant="outline"
                        onClick={handleLogout}
                        className="font-space-grotesk"
                    >
                        <LogOut className="size-4" />
                        Sign out
                    </Button>
                </div>
            </SettingsCard>

            <SettingsCard title="Account removal" description="Permanently delete this account and associated data.">
                <div className="px-5 py-5 sm:px-6">
                    {deleteConfirm ? (
                        <motion.div
                            data-testid="settings-delete-confirm-panel"
                            className="rounded-2xl border border-border bg-muted/35 p-4"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                            <p className="text-sm font-medium text-foreground">
                                Confirm account deletion
                            </p>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                This cannot be undone. Your profile and stored workspace data will be removed.
                            </p>
                            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                <Button
                                    data-testid="settings-delete-cancel-button"
                                    variant="outline"
                                    onClick={() => setDeleteConfirm(false)}
                                    disabled={isDeleting}
                                    className="font-space-grotesk"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    data-testid="settings-delete-confirm-button"
                                    onClick={handleDeleteAccount}
                                    disabled={isDeleting}
                                    loading={isDeleting}
                                    className="font-space-grotesk"
                                >
                                    {isDeleting ? "Deleting" : "Delete account"}
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <Button
                            data-testid="settings-delete-account-button"
                            variant="outline"
                            onClick={() => setDeleteConfirm(true)}
                            className="font-space-grotesk"
                        >
                            Delete account
                        </Button>
                    )}
                </div>
            </SettingsCard>
        </motion.div>
    );
}
