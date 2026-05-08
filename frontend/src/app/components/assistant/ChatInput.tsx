"use client";

import {
    useState,
    useCallback,
    useRef,
    forwardRef,
    useImperativeHandle,
    useEffect,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import {
    ArrowRight,
    BookOpen,
    Check,
    File,
    FileText,
    FolderOpen,
    Library,
    Mic,
    MicOff,
    Square,
    X,
} from "lucide-react";
import { AddDocButton } from "./AddDocButton";
import { AddDocumentsModal } from "../shared/AddDocumentsModal";
import { AssistantWorkflowModal } from "./AssistantWorkflowModal";
import { ApiKeyMissingModal } from "../shared/ApiKeyMissingModal";
import { ModelToggle } from "./ModelToggle";
import {
    SourcesSelector,
    type SourcesSelection,
} from "./SourcesSelector";
import { buildLegalContextBlock, prefetchLegalCountries, searchLegalData } from "@/app/lib/legalDataApi";
import { COUNTRY_NAMES } from "@/app/lib/legalDataApi";
import { Button } from "@/components/ui/button";
import { useSelectedModel } from "@/app/hooks/useSelectedModel";
import { useUserProfile } from "@/contexts/UserProfileContext";
import {
    getModelProvider,
    isModelAvailable,
    type ModelProvider,
} from "@/app/lib/modelAvailability";
import type { OpenSpecterDocument, OpenSpecterMessage } from "../shared/types";

export interface ChatInputHandle {
    addDoc: (doc: OpenSpecterDocument) => void;
}

interface Props {
    onSubmit: (message: OpenSpecterMessage) => void;
    onCancel: () => void;
    isLoading: boolean;
    hideAddDocButton?: boolean;
    hideWorkflowButton?: boolean;
    onProjectsClick?: () => void;
    projectName?: string;
    projectCmNumber?: string | null;
}

const autoGrow = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
};

export const ChatInput = forwardRef<ChatInputHandle, Props>(function ChatInput(
    {
        onSubmit,
        onCancel,
        isLoading,
        hideAddDocButton,
        hideWorkflowButton,
        onProjectsClick,
        projectName,
        projectCmNumber,
    }: Props,
    ref,
) {
    const [value, setValue] = useState("");
    const [attachedDocs, setAttachedDocs] = useState<OpenSpecterDocument[]>([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState<{
        id: string;
        title: string;
    } | null>(null);
    const [sourcesSelection, setSourcesSelection] =
        useState<SourcesSelection | null>(null);
    const [sourcesLoading, setSourcesLoading] = useState(false);
    const [sourcesError, setSourcesError] = useState<string | null>(null);
    const [model, setModel] = useSelectedModel();
    const { profile } = useUserProfile();
    const apiKeys = {
        claudeApiKey: profile?.claudeApiKey ?? null,
        geminiApiKey: profile?.geminiApiKey ?? null,
    };
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [docSelectorOpen, setDocSelectorOpen] = useState(false);
    const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
    const [apiKeyModalProvider, setApiKeyModalProvider] =
        useState<ModelProvider | null>(null);
    const [focused, setFocused] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [speechError, setSpeechError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);
    const speechBaseRef = useRef("");
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        if (typeof window === "undefined") return;
        setSpeechSupported(
            Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition),
        );
        return () => {
            recognitionRef.current?.stop?.();
        };
    }, []);


    useEffect(() => {
        requestAnimationFrame(() => autoGrow(textareaRef.current));
    }, []);

    // Prefetch LegalDataHunter countries on mount so the Sources popover opens instantly.
    useEffect(() => {
        prefetchLegalCountries().catch(() => {
            /* silent — Sources popover falls back to load-on-open */
        });
    }, []);

    useImperativeHandle(ref, () => ({
        addDoc: (doc: OpenSpecterDocument) => {
            setAttachedDocs((prev) => {
                if (prev.some((d) => d.id === doc.id)) return prev;
                return [...prev, doc];
            });
        },
    }));

    const handleAddDocFromProject = useCallback((doc: OpenSpecterDocument) => {
        setAttachedDocs((prev) => {
            if (prev.some((d) => d.id === doc.id)) return prev;
            return [...prev, doc];
        });
    }, []);

    const handleAddDocsFromSelector = useCallback(
        (selectedDocs: OpenSpecterDocument[]) => {
            setAttachedDocs((prev) => {
                const existing = new Set(prev.map((d) => d.id));
                return [
                    ...prev,
                    ...selectedDocs.filter((d) => !existing.has(d.id)),
                ];
            });
        },
        [],
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
        autoGrow(e.target);
    };

    const handleSubmit = async () => {
        const query = value.trim();
        if (!query || isLoading) return;
        if (!isModelAvailable(model, apiKeys)) {
            setApiKeyModalProvider(getModelProvider(model));
            return;
        }

        // Snapshot the current UI state BEFORE we clear anything.
        const currentDocs = attachedDocs;
        const currentWorkflow = selectedWorkflow;
        const currentSources = sourcesSelection;

        const files = currentDocs.map((d) => ({
            filename: d.filename,
            document_id: d.id,
        }));

        // Pre-flight legal search FIRST (so the user keeps seeing their typed
        // text + the "Retrieving legal sources…" hint while we wait). Only
        // after the search completes do we clear the UI and post the message.
        let finalContent = query;
        if (currentSources) {
            setSourcesLoading(true);
            setSourcesError(null);
            try {
                const res = await searchLegalData({
                    q: query,
                    country: currentSources.country,
                    namespace: currentSources.namespace,
                    top_k: 5,
                });
                const block = buildLegalContextBlock(res.hits, {
                    country: currentSources.country,
                    namespace: currentSources.namespace,
                });
                if (block) {
                    finalContent = `${block}\n\n${query}`;
                }
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                setSourcesError(
                    `Couldn't retrieve legal sources (${msg.slice(0, 120)}). Sending your message without research context.`,
                );
            } finally {
                setSourcesLoading(false);
            }
        }

        // Now reset the input and post.
        setValue("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        setAttachedDocs([]);
        setSelectedWorkflow(null);

        onSubmit?.({
            role: "user",
            content: finalContent,
            files: files.length > 0 ? files : undefined,
            workflow: currentWorkflow ?? undefined,
            model,
        });
    };

    const handleActionClick = () => {
        if (isLoading) onCancel();
        else handleSubmit();
    };

    const handleVoiceInput = () => {
        setSpeechError(null);

        if (isListening) {
            recognitionRef.current?.stop?.();
            setIsListening(false);
            return;
        }

        if (typeof window === "undefined") return;
        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setSpeechError("Voice input is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        speechBaseRef.current = value.trim();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => setIsListening(true);
        recognition.onerror = (event: any) => {
            const reason = event?.error === "not-allowed"
                ? "Microphone access was denied."
                : "Voice input stopped. Please try again.";
            setSpeechError(reason);
            setIsListening(false);
        };
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            let transcript = "";
            for (let i = 0; i < event.results.length; i += 1) {
                transcript += event.results[i][0]?.transcript ?? "";
            }
            const cleanTranscript = transcript.replace(/\s+/g, " ").trim();
            const base = speechBaseRef.current;
            const nextValue = [base, cleanTranscript].filter(Boolean).join(" ");
            setValue(nextValue);
            requestAnimationFrame(() => autoGrow(textareaRef.current));
        };

        try {
            recognition.start();
        } catch {
            setSpeechError("Voice input is already active.");
        }
    };


    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <>
            <div
                data-testid="assistant-prompt-box"
                className="w-full"
            >
                <motion.div
                    className="overflow-hidden rounded-2xl border border-border/70 bg-card/75 shadow-[0_10px_30px_rgba(2,6,23,0.06)] backdrop-blur-md transition-[border-color,box-shadow,background-color] duration-200"
                    animate={
                        focused && !prefersReducedMotion
                            ? {
                                  y: -1,
                                  boxShadow:
                                      "0 18px 44px rgba(2,6,23,0.10), 0 0 0 4px rgba(2,6,23,0.08)",
                              }
                            : {
                                  y: 0,
                                  boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
                              }
                    }
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    onFocusCapture={() => setFocused(true)}
                    onBlurCapture={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                            setFocused(false);
                        }
                    }}
                >
                    {(selectedWorkflow || sourcesSelection || attachedDocs.length > 0) && (
                        <div className="flex flex-wrap gap-1.5 px-4 pt-3">
                            {selectedWorkflow && (
                                <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/45 py-1 pr-1 pl-2.5 text-xs text-foreground shadow-sm">
                                    <Library className="size-3 shrink-0" />
                                    <span className="max-w-[180px] truncate">
                                        {selectedWorkflow.title}
                                    </span>
                                    <button
                                        type="button"
                                        aria-label="Remove workflow"
                                        onClick={() => setSelectedWorkflow(null)}
                                        className="ml-0.5 rounded-full p-0.5 text-muted-foreground transition-[background-color,color] duration-150 hover:bg-background hover:text-foreground"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </div>
                            )}
                            {sourcesSelection && (
                                <div
                                    data-testid="assistant-prompt-sources-chip"
                                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/45 py-1 pr-1 pl-2.5 text-xs text-foreground shadow-sm"
                                >
                                    <BookOpen className="size-3 shrink-0" />
                                    <span className="max-w-[220px] truncate">
                                        {`${COUNTRY_NAMES[sourcesSelection.country] ?? sourcesSelection.country}${sourcesSelection.namespace !== "all" ? ` · ${sourcesSelection.namespace.replace("_", " ")}` : ""}`}
                                    </span>
                                    <button
                                        type="button"
                                        aria-label="Remove legal sources"
                                        data-testid="assistant-prompt-sources-chip-remove"
                                        onClick={() => setSourcesSelection(null)}
                                        className="ml-0.5 rounded-full p-0.5 text-muted-foreground transition-[background-color,color] duration-150 hover:bg-background hover:text-foreground"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </div>
                            )}
                            {attachedDocs.map((doc) => {
                                const ft = doc.file_type?.toLowerCase();
                                const isPdf = ft === "pdf";
                                return (
                                    <div
                                        key={doc.id}
                                        className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/80 py-1 pr-1 pl-2.5 text-xs text-foreground shadow-sm"
                                    >
                                        {isPdf ? (
                                            <FileText className="size-3 shrink-0 text-foreground/70" />
                                        ) : (
                                            <File className="size-3 shrink-0 text-foreground/70" />
                                        )}
                                        <span className="max-w-[180px] truncate">
                                            {doc.filename}
                                        </span>
                                        <button
                                            type="button"
                                            aria-label={`Remove ${doc.filename}`}
                                            onClick={() =>
                                                setAttachedDocs((prev) =>
                                                    prev.filter((d) => d.id !== doc.id),
                                                )
                                            }
                                            className="ml-0.5 rounded-full p-0.5 text-muted-foreground transition-[background-color,color] duration-150 hover:bg-muted hover:text-foreground"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="px-4 pt-4">
                        <textarea
                            ref={textareaRef}
                            data-testid="assistant-prompt-textarea"
                            rows={1}
                            placeholder="Ask a question, draft a clause, or analyze your legal documents..."
                            value={value}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            className="max-h-[220px] min-h-[64px] w-full resize-none overflow-hidden rounded-xl border border-border/60 bg-background/65 px-3 py-3 text-base leading-6 text-foreground shadow-sm outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-muted-foreground focus-visible:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring/30"
                        />
                        {speechError && (
                            <p className="mt-2 text-xs text-muted-foreground" data-testid="assistant-prompt-speech-error">
                                {speechError}
                            </p>
                        )}
                        {sourcesLoading && (
                            <p
                                className="mt-2 text-xs text-muted-foreground"
                                data-testid="assistant-prompt-sources-loading"
                            >
                                Retrieving legal sources…
                            </p>
                        )}
                        {sourcesError && (
                            <p
                                className="mt-2 text-xs text-muted-foreground"
                                data-testid="assistant-prompt-sources-error"
                            >
                                {sourcesError}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 px-3 pb-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-1.5">
                            {!hideAddDocButton && (
                                <div data-testid="assistant-prompt-attach-button">
                                    <AddDocButton
                                        onSelectDoc={handleAddDocFromProject}
                                        onBrowseAll={() => setDocSelectorOpen(true)}
                                        selectedDocIds={attachedDocs.map((d) => d.id)}
                                    />
                                </div>
                            )}
                            {onProjectsClick && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={onProjectsClick}
                                    aria-label="Open projects"
                                    data-testid="assistant-prompt-projects-button"
                                    className="h-8 font-space-grotesk text-sm font-[520] text-muted-foreground transition-[background-color,color] duration-150 hover:bg-muted/65 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/35"
                                >
                                    <FolderOpen className="size-3.5" />
                                    <span className="hidden sm:inline">Projects</span>
                                </Button>
                            )}
                            {!hideWorkflowButton && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setWorkflowModalOpen(true)}
                                    aria-label="Open workflows"
                                    data-testid="assistant-prompt-templates-button"
                                    className={
                                        selectedWorkflow
                                            ? "h-8 bg-muted font-space-grotesk text-sm font-[520] text-foreground transition-[background-color,color] duration-150 hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring/35"
                                            : "h-8 font-space-grotesk text-sm font-[520] text-muted-foreground transition-[background-color,color] duration-150 hover:bg-muted/65 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/35"
                                    }
                                >
                                    {selectedWorkflow ? (
                                        <Check className="size-3.5" />
                                    ) : (
                                        <Library className="size-3.5" />
                                    )}
                                    <span className="hidden sm:inline">Workflows</span>
                                </Button>
                            )}
                            <SourcesSelector
                                value={sourcesSelection}
                                onChange={setSourcesSelection}
                            />
                        </div>

                        <div className="flex items-center justify-between gap-2 sm:justify-end">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                data-testid="assistant-prompt-microphone-button"
                                onClick={handleVoiceInput}
                                disabled={!speechSupported || isLoading}
                                aria-label={isListening ? "Stop voice input" : "Start voice input"}
                                className={`size-9 rounded-xl ${
                                    isListening
                                        ? "bg-muted text-foreground"
                                        : "text-muted-foreground hover:bg-muted/65 hover:text-foreground"
                                }`}
                                title={
                                    speechSupported
                                        ? isListening
                                            ? "Stop voice input"
                                            : "Start voice input"
                                        : "Voice input is not supported in this browser"
                                }
                            >
                                {isListening ? (
                                    <MicOff className="size-4" />
                                ) : (
                                    <Mic className="size-4" />
                                )}
                            </Button>
                            <ModelToggle
                                value={model}
                                onChange={setModel}
                                apiKeys={apiKeys}
                            />
                            <Button
                                type="button"
                                size="icon"
                                data-testid="assistant-prompt-send-button"
                                className="size-9 rounded-xl bg-black text-white hover:bg-black/90"
                                onClick={handleActionClick}
                                disabled={(!isLoading && !value.trim()) || sourcesLoading}
                                aria-label={isLoading ? "Cancel response" : "Send message"}
                            >
                                {isLoading ? (
                                    <Square className="size-4" fill="currentColor" strokeWidth={0} />
                                ) : (
                                    <ArrowRight className="size-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>

            <AddDocumentsModal
                open={docSelectorOpen}
                onClose={() => setDocSelectorOpen(false)}
                onSelect={handleAddDocsFromSelector}
                breadcrumb={["Assistant", "Add Documents"]}
            />
            <AssistantWorkflowModal
                open={workflowModalOpen}
                onClose={() => setWorkflowModalOpen(false)}
                onSelect={(wf) => {
                    setSelectedWorkflow({ id: wf.id, title: wf.title });
                    setWorkflowModalOpen(false);
                }}
                projectName={projectName}
                projectCmNumber={projectCmNumber}
            />
            <ApiKeyMissingModal
                open={apiKeyModalProvider !== null}
                provider={apiKeyModalProvider}
                onClose={() => setApiKeyModalProvider(null)}
            />
        </>
    );
});
