"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, ChevronDown, ExternalLink, File, FileText, Library } from "lucide-react";
import { extractLegalContext } from "@/app/lib/legalDataApi";

interface Props {
    content: string;
    files?: { filename: string; document_id?: string }[];
    workflow?: { id: string; title: string };
}

export function UserMessage({ content, files, workflow }: Props) {
    const hasFiles = files && files.length > 0;
    const { context, userText } = extractLegalContext(content);
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="w-full flex justify-end">
            <div className="max-w-[80%] bg-gray-100 rounded-xl px-4 py-3">
                {context && (
                    <div className="mb-2.5">
                        <button
                            type="button"
                            data-testid="user-message-legal-sources-toggle"
                            onClick={() => setExpanded((v) => !v)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-2.5 py-1 font-space-grotesk text-[11px] font-[520] text-gray-700 shadow-sm transition-[background-color,border-color,color] duration-150 hover:border-gray-400 hover:bg-gray-50"
                            aria-expanded={expanded}
                        >
                            <BookOpen className="size-3 shrink-0 text-gray-500" />
                            <span>
                                {context.authorities.length} legal source
                                {context.authorities.length === 1 ? "" : "s"} used
                            </span>
                            {context.scope && (
                                <span className="text-gray-400">·</span>
                            )}
                            {context.scope && (
                                <span className="text-gray-500">{context.scope}</span>
                            )}
                            <ChevronDown
                                className={`size-3 shrink-0 text-gray-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                            />
                        </button>

                        <AnimatePresence initial={false}>
                            {expanded && context.authorities.length > 0 && (
                                <motion.div
                                    key="authorities"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                    className="overflow-hidden"
                                >
                                    <div
                                        data-testid="user-message-legal-sources-panel"
                                        className="mt-2 space-y-2 rounded-xl border border-gray-200 bg-white/70 p-3"
                                    >
                                        {context.authorities.map((a) => (
                                            <a
                                                key={a.index}
                                                href={a.url ?? "#"}
                                                target={a.url ? "_blank" : undefined}
                                                rel={a.url ? "noopener noreferrer" : undefined}
                                                onClick={(e) => {
                                                    if (!a.url) e.preventDefault();
                                                }}
                                                className={`flex gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                                                    a.url ? "cursor-pointer hover:bg-gray-50" : "cursor-default"
                                                }`}
                                            >
                                                <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-md bg-gray-900 font-space-grotesk text-[10px] font-[600] text-white">
                                                    {a.index}
                                                </span>
                                                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                    <span className="truncate text-gray-900 font-[520]">
                                                        {a.title}
                                                    </span>
                                                    {a.meta && (
                                                        <span className="truncate text-[10.5px] text-gray-500">
                                                            {a.meta}
                                                        </span>
                                                    )}
                                                </span>
                                                {a.url && (
                                                    <ExternalLink className="size-3 shrink-0 self-center text-gray-400" />
                                                )}
                                            </a>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                <p className="text-sm text-gray-900 whitespace-pre-wrap">{userText}</p>

                {(workflow || hasFiles) && (
                    <div className="flex flex-wrap justify-end gap-1.5 mt-3">
                        {workflow && (
                            <div className="inline-flex items-center gap-1 pl-2 pr-2.5 py-0.5 rounded-full text-xs bg-foreground text-white shadow border border-foreground">
                                <Library className="h-2.5 w-2.5 shrink-0" />
                                <span className="max-w-[140px] truncate">{workflow.title}</span>
                            </div>
                        )}
                        {hasFiles && files.map((f, i) => {
                            const ext = f.filename.split(".").pop()?.toLowerCase();
                            const isPdf = ext === "pdf";
                            return (
                                <div
                                    key={i}
                                    className="inline-flex items-center gap-1 pl-2 pr-2.5 py-0.5 rounded-full text-xs text-white shadow border border-black bg-black"
                                >
                                    {isPdf
                                        ? <FileText className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
                                        : <File className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
                                    }
                                    <span className="max-w-[140px] truncate">{f.filename}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
