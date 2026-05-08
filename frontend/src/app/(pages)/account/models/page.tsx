"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { AlertCircle, Check, ChevronDown, Eye, EyeOff, KeyRound, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { MODELS } from "@/app/components/assistant/ModelToggle";
import {
    isModelAvailable,
    modelGroupToProvider,
} from "@/app/lib/modelAvailability";

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
            <div>{children}</div>
        </section>
    );
}

export default function ModelsAndApiKeysPage() {
    const { profile, updateModelPreference, updateApiKey } = useUserProfile();

    return (
        <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
            <SettingsCard
                title="Models"
                description="Choose the model Open Specter should use for structured tabular review work."
            >
                <div className="grid gap-4 px-5 py-5 sm:px-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground/80">
                            <SlidersHorizontal className="size-4" />
                        </div>
                        <div>
                            <p className="font-space-grotesk text-sm font-[550] text-foreground">
                                Tabular review model
                            </p>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                Availability depends on configured provider keys.
                            </p>
                        </div>
                    </div>
                    <TabularModelDropdown
                        value={profile?.tabularModel ?? "gemini-3-flash-preview"}
                        apiKeys={{
                            claudeApiKey: profile?.claudeApiKey ?? null,
                            geminiApiKey: profile?.geminiApiKey ?? null,
                        }}
                        onChange={(id) => updateModelPreference("tabularModel", id)}
                    />
                </div>
            </SettingsCard>

            <SettingsCard
                title="API keys"
                description="Connect model providers and data sources. Keys are stored against your user profile and can be removed by saving an empty value."
            >
                <div className="space-y-4 p-5 sm:p-6">
                    <p className="text-xs leading-5 text-muted-foreground">
                        Title generation automatically routes to the most efficient configured provider.
                    </p>
                    <ApiKeyField
                        provider="Anthropic"
                        testIdPrefix="claude"
                        label="Claude API key"
                        placeholder="sk-ant-…"
                        initialValue={profile?.claudeApiKey ?? ""}
                        onSave={(value) => updateApiKey("claude", value.trim() || null)}
                    />
                    <ApiKeyField
                        provider="Google"
                        testIdPrefix="gemini"
                        label="Gemini API key"
                        placeholder="AI…"
                        initialValue={profile?.geminiApiKey ?? ""}
                        onSave={(value) => updateApiKey("gemini", value.trim() || null)}
                    />
                    <ApiKeyField
                        provider="LegalDataHunter"
                        testIdPrefix="legal-data-hunter"
                        label="LegalDataHunter API key"
                        placeholder="sk-…"
                        helperText="Powers the Sources button — search 30M+ case laws, statutes, and doctrine across 178 countries. Falls back to the system key when empty."
                        initialValue={profile?.legalDataHunterApiKey ?? ""}
                        onSave={(value) =>
                            updateApiKey("legal_data_hunter", value.trim() || null)
                        }
                    />
                </div>
            </SettingsCard>
        </motion.div>
    );
}

function TabularModelDropdown({
    value,
    onChange,
    apiKeys,
}: {
    value: string;
    onChange: (id: string) => void;
    apiKeys: { claudeApiKey: string | null; geminiApiKey: string | null };
}) {
    const [isOpen, setIsOpen] = useState(false);
    const selected = MODELS.find((m) => m.id === value);
    const selectedAvailable = isModelAvailable(value, apiKeys);
    const groups: ("Anthropic" | "Google")[] = ["Anthropic", "Google"];

    return (
        <DropdownMenu onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    data-testid="settings-model-dropdown-trigger"
                    className="flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 text-sm shadow-sm transition-[background-color,border-color,box-shadow] duration-150 hover:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-ring/35"
                >
                    <span className="flex min-w-0 items-center gap-2">
                        {!selectedAvailable && (
                            <AlertCircle className="size-3.5 shrink-0 text-muted-foreground" />
                        )}
                        <span className="truncate text-foreground">
                            {selected?.label ?? "Select a model"}
                        </span>
                    </span>
                    <ChevronDown
                        className={`size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                data-testid="settings-model-dropdown-content"
                style={{ width: "var(--radix-dropdown-menu-trigger-width)" }}
                align="start"
            >
                {groups.map((group, gi) => {
                    const items = MODELS.filter((m) => m.group === group);
                    if (items.length === 0) return null;
                    return (
                        <div key={group}>
                            {gi > 0 && <DropdownMenuSeparator />}
                            <DropdownMenuLabel className="font-space-grotesk text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                                {group}
                            </DropdownMenuLabel>
                            {items.map((m) => {
                                const provider = modelGroupToProvider(m.group);
                                const available = isModelAvailable(m.id, apiKeys);
                                return (
                                    <DropdownMenuItem
                                        key={m.id}
                                        data-testid="settings-model-dropdown-item"
                                        className="cursor-pointer"
                                        onSelect={() => onChange(m.id)}
                                        title={
                                            !available
                                                ? `Add a ${provider === "claude" ? "Claude" : "Gemini"} API key to use this model`
                                                : undefined
                                        }
                                    >
                                        <span className={`flex-1 ${available ? "" : "text-muted-foreground"}`}>
                                            {m.label}
                                        </span>
                                        {!available && (
                                            <AlertCircle className="ml-1 size-3.5 text-muted-foreground" />
                                        )}
                                        {m.id === value && available && (
                                            <Check className="ml-1 size-3.5 text-foreground/70" />
                                        )}
                                    </DropdownMenuItem>
                                );
                            })}
                        </div>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function ApiKeyField({
    provider,
    testIdPrefix,
    label,
    placeholder,
    initialValue,
    onSave,
    helperText,
}: {
    provider: string;
    testIdPrefix: string;
    label: string;
    placeholder: string;
    initialValue: string;
    onSave: (value: string) => Promise<boolean>;
    helperText?: string;
}) {
    const [value, setValue] = useState(initialValue);
    const [reveal, setReveal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    const dirty = value !== initialValue;

    const handleSave = async () => {
        setIsSaving(true);
        const ok = await onSave(value);
        setIsSaving(false);
        if (ok) {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } else {
            alert(`Failed to save ${label}.`);
        }
    };

    return (
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-background text-foreground/80 shadow-sm">
                        <KeyRound className="size-4" />
                    </div>
                    <div>
                        <label className="font-space-grotesk text-sm font-[550] text-foreground">
                            {label}
                        </label>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {provider} provider credential
                        </p>
                    </div>
                </div>
                {saved && (
                    <span className="rounded-full border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
                        Saved
                    </span>
                )}
            </div>
            {helperText && (
                <p className="mb-3 text-xs leading-5 text-muted-foreground">
                    {helperText}
                </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                    <Input
                        data-testid={`settings-${testIdPrefix}-api-key-input`}
                        type={reveal ? "text" : "password"}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        className="h-10 pr-10"
                        autoComplete="off"
                        spellCheck={false}
                    />
                    <button
                        type="button"
                        data-testid={`settings-${testIdPrefix}-api-key-reveal-button`}
                        onClick={() => setReveal((r) => !r)}
                        className="absolute inset-y-0 right-2 flex items-center rounded-md px-2 text-muted-foreground transition-[background-color,color] duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                        aria-label={reveal ? "Hide key" : "Show key"}
                    >
                        {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                </div>
                <Button
                    data-testid={`settings-${testIdPrefix}-api-key-save-button`}
                    onClick={handleSave}
                    disabled={isSaving || !dirty || saved}
                    loading={isSaving}
                    className="h-10 min-w-[92px] font-space-grotesk"
                >
                    {saved ? "Saved" : "Save"}
                </Button>
            </div>
        </div>
    );
}
