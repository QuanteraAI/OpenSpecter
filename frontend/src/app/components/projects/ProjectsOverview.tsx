"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { HeaderSearchBtn } from "@/app/components/shared/HeaderSearchBtn";
import { listProjects, updateProject, deleteProject } from "@/app/lib/openSpecterApi";
import { OwnerOnlyModal } from "@/app/components/shared/OwnerOnlyModal";
import { useAuth } from "@/contexts/AuthContext";
import type { OpenSpecterProject } from "@/app/components/shared/types";
import { NewProjectModal } from "./NewProjectModal";
import { ToolbarTabs } from "@/app/components/shared/ToolbarTabs";
import { RowActions } from "@/app/components/shared/RowActions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/app/components/shared/EmptyState";



function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

type Tab = "all" | "mine" | "shared-with-me";

const CHECK_W = "w-8 shrink-0";
const NAME_COL_W = "w-[300px] shrink-0";

export function ProjectsOverview() {
    const [projects, setProjects] = useState<OpenSpecterProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("all");
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [cmEditingId, setCmEditingId] = useState<string | null>(null);
    const [cmValue, setCmValue] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [actionsOpen, setActionsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [ownerOnlyAction, setOwnerOnlyAction] = useState<string | null>(null);
    const actionsRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        listProjects()
            .then(setProjects)
            .catch(() => setProjects([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        setSelectedIds([]);
    }, [activeTab]);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (
                actionsRef.current &&
                !actionsRef.current.contains(e.target as Node)
            )
                setActionsOpen(false);
        }
        if (actionsOpen) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [actionsOpen]);

    const q = search.toLowerCase();
    const filtered = (
        activeTab === "all"
            ? projects
            : activeTab === "mine"
              ? projects.filter((p) => p.is_owner ?? p.user_id === user?.id)
              : projects.filter((p) => !(p.is_owner ?? p.user_id === user?.id))
    ).filter(
        (p) =>
            !q ||
            p.name.toLowerCase().includes(q) ||
            (p.cm_number ?? "").toLowerCase().includes(q),
    );

    const allSelected =
        filtered.length > 0 &&
        filtered.every((p) => selectedIds.includes(p.id));
    const someSelected =
        !allSelected && filtered.some((p) => selectedIds.includes(p.id));

    function toggleAll() {
        if (allSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filtered.map((p) => p.id));
        }
    }

    function toggleOne(id: string) {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    }

    const tabs: { id: Tab; label: string }[] = [
        { id: "all", label: "All" },
        { id: "mine", label: "Mine" },
        { id: "shared-with-me", label: "Shared with me" },
    ];

    async function handleRenameSubmit(projectId: string) {
        const trimmed = renameValue.trim();
        setRenamingId(null);
        if (!trimmed) return;
        setProjects((prev) =>
            prev.map((p) => (p.id === projectId ? { ...p, name: trimmed } : p)),
        );
        await updateProject(projectId, { name: trimmed });
    }

    async function handleCmSubmit(projectId: string) {
        const trimmed = cmValue.trim();
        setCmEditingId(null);
        setProjects((prev) =>
            prev.map((p) =>
                p.id === projectId ? { ...p, cm_number: trimmed || null } : p,
            ),
        );
        await updateProject(projectId, { cm_number: trimmed || undefined });
    }

    async function handleDeleteSelected() {
        const ids = [...selectedIds];
        setActionsOpen(false);
        // Only the project owner can delete; the per-row delete is hidden
        // for shared projects but the bulk action can still pick them up
        // if a user toggled them across tabs. Filter and warn.
        const owned = ids.filter((id) => {
            const p = projects.find((pp) => pp.id === id);
            return !p || (p.is_owner ?? p.user_id === user?.id);
        });
        const blocked = ids.length - owned.length;
        setSelectedIds([]);
        await Promise.all(owned.map((id) => deleteProject(id).catch(() => {})));
        setProjects((prev) => prev.filter((p) => !owned.includes(p.id)));
        if (blocked > 0) {
            setOwnerOnlyAction(
                `delete ${blocked} of the selected projects — only the project owner can delete a project`,
            );
        }
    }

    const toolbarActions = (
        <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
                <div ref={actionsRef} className="relative">
                    <button
                        onClick={() => setActionsOpen((v) => !v)}
                        className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    >
                        Actions
                        <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    {actionsOpen && (
                        <div className="absolute top-full right-0 mt-1 w-36 rounded-lg border border-gray-100 bg-white shadow-lg z-50 overflow-hidden">
                            <button
                                onClick={handleDeleteSelected}
                                className="w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-muted/50 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto bg-white">
            {/* Page header */}
            <div className="flex items-center justify-between gap-6 px-8 py-4">
                <div className="min-w-0">
                    <h1 className="font-space-grotesk text-2xl font-[560] tracking-[-0.035em] text-gray-900">
                        Projects
                    </h1>
                    <p
                        data-testid="projects-page-description"
                        className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground"
                    >
                        Organize documents and collaborate on matter-specific work.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <HeaderSearchBtn
                        value={search}
                        onChange={setSearch}
                        placeholder="Search projects…"
                    />
                    <Button
                        type="button"
                        data-testid="projects-create-button"
                        aria-label="Create new project"
                        onClick={() => setModalOpen(true)}
                        className="h-9 rounded-full bg-gray-950 px-4 font-space-grotesk text-sm font-[520] text-white shadow-[0_8px_20px_rgba(2,6,23,0.08)] transition-[background-color,transform,box-shadow] duration-150 hover:bg-gray-800 hover:shadow-[0_10px_24px_rgba(2,6,23,0.12)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring/35"
                    >
                        Create
                    </Button>
                </div>
            </div>

            <ToolbarTabs
                tabs={tabs}
                active={activeTab}
                onChange={setActiveTab}
                actions={toolbarActions}
            />

            {/* Table */}
            <div className="w-full overflow-x-auto">
                <div className="min-w-max">
                {/* Column headers */}
                <div className="flex items-center h-8 pr-8 border-b border-gray-200 text-xs text-gray-500 font-medium select-none">
                    <div className={`sticky left-0 z-[60] ${CHECK_W} relative bg-white flex items-center justify-center self-stretch before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-white`}>
                        {!loading && (
                            <input
                                type="checkbox"
                                checked={allSelected}
                                ref={(el) => {
                                    if (el) el.indeterminate = someSelected;
                                }}
                                onChange={toggleAll}
                                className="h-2.5 w-2.5 rounded border-gray-200 cursor-pointer accent-black"
                            />
                        )}
                    </div>
                    <div className={`sticky left-8 z-[60] ${NAME_COL_W} bg-white pl-2 text-left`}>
                        Name
                    </div>
                    <div className="ml-auto w-32 shrink-0 text-left">CM</div>
                    <div className="w-24 shrink-0 text-left">Files</div>
                    <div className="w-24 shrink-0 text-left">Chats</div>
                    <div className="w-36 shrink-0 text-left">
                        Tabular Reviews
                    </div>
                    <div className="w-32 shrink-0 text-left">Created</div>
                    <div className="w-8 shrink-0" />
                </div>

                {loading ? (
                    <div>
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="flex items-center h-10 pr-8 border-b border-gray-50"
                            >
                                <div className="w-8 shrink-0" />
                                <div className="flex-1 min-w-0 pl-3 pr-4">
                                    <div className="h-3.5 w-48 rounded bg-gray-100 animate-pulse" />
                                </div>
                                <div className="w-32 shrink-0">
                                    <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
                                </div>
                                <div className="w-24 shrink-0">
                                    <div className="h-3 w-8 rounded bg-gray-100 animate-pulse" />
                                </div>
                                <div className="w-24 shrink-0">
                                    <div className="h-3 w-8 rounded bg-gray-100 animate-pulse" />
                                </div>
                                <div className="w-36 shrink-0">
                                    <div className="h-3 w-8 rounded bg-gray-100 animate-pulse" />
                                </div>
                                <div className="w-32 shrink-0">
                                    <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
                                </div>
                                <div className="w-8 shrink-0" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={activeTab === "shared-with-me" ? "search" : "projects"}
                        title={
                            activeTab === "shared-with-me"
                                ? "No shared projects"
                                : "Create your first project"
                        }
                        description={
                            activeTab === "shared-with-me"
                                ? "Projects shared with you will appear here once collaborators invite you into a workspace."
                                : "Upload documents into a dedicated workspace, then run assistant chats and tabular reviews with the right context."
                        }
                        actionLabel={
                            activeTab === "all" || activeTab === "mine"
                                ? "Create new"
                                : undefined
                        }
                        onAction={
                            activeTab === "all" || activeTab === "mine"
                                ? () => setModalOpen(true)
                                : undefined
                        }
                        actionTestId="projects-empty-create-new-button"
                    />
                ) : (
                    <div>
                        {filtered.map((project) => {
                            const rowBg = selectedIds.includes(project.id)
                                ? "bg-gray-50"
                                : "bg-white";
                            return (
                            <div
                                key={project.id}
                                onClick={() => {
                                    if (renamingId === project.id) return;
                                    router.push(`/projects/${project.id}`);
                                }}
                                className="group flex items-center h-10 pr-8 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <div
                                    className={`sticky left-0 z-[60] ${CHECK_W} p-2 flex items-center justify-center ${rowBg} group-hover:bg-gray-50`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(
                                            project.id,
                                        )}
                                        onChange={() => toggleOne(project.id)}
                                        className="h-2.5 w-2.5 rounded border-gray-200 cursor-pointer accent-black"
                                    />
                                </div>

                                {/* Project Name */}
                                <div className={`sticky left-8 z-[60] ${NAME_COL_W} p-2 ${rowBg} group-hover:bg-gray-50`}>
                                    {renamingId === project.id ? (
                                        <input
                                            autoFocus
                                            value={renameValue}
                                            onChange={(e) =>
                                                setRenameValue(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter")
                                                    handleRenameSubmit(
                                                        project.id,
                                                    );
                                                if (e.key === "Escape")
                                                    setRenamingId(null);
                                            }}
                                            onBlur={() =>
                                                handleRenameSubmit(project.id)
                                            }
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-full text-sm text-gray-800 bg-transparent outline-none"
                                        />
                                    ) : (
                                        <span className="text-sm text-gray-800 truncate block">
                                            {project.name}
                                        </span>
                                    )}
                                </div>

                                <div
                                    className="ml-auto w-32 shrink-0 text-sm text-gray-500 truncate"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {cmEditingId === project.id ? (
                                        <input
                                            autoFocus
                                            value={cmValue}
                                            onChange={(e) =>
                                                setCmValue(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter")
                                                    handleCmSubmit(project.id);
                                                if (e.key === "Escape")
                                                    setCmEditingId(null);
                                            }}
                                            onBlur={() =>
                                                handleCmSubmit(project.id)
                                            }
                                            placeholder="CM #"
                                            className="w-full text-sm text-gray-800 bg-transparent outline-none"
                                        />
                                    ) : (
                                        (project.cm_number ?? (
                                            <span className="text-gray-300">
                                                —
                                            </span>
                                        ))
                                    )}
                                </div>
                                <div className="w-24 shrink-0 text-sm text-gray-500 truncate">
                                    {project.document_count ?? 0}
                                </div>
                                <div className="w-24 shrink-0 text-sm text-gray-500 truncate">
                                    {project.chat_count ?? 0}
                                </div>
                                <div className="w-36 shrink-0 text-sm text-gray-500 truncate">
                                    {project.review_count ?? 0}
                                </div>
                                <div className="w-32 shrink-0 text-sm text-gray-500 truncate">
                                    {formatDate(project.created_at)}
                                </div>

                                <div
                                    className="w-8 shrink-0 flex justify-end"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {(project.is_owner ??
                                        project.user_id === user?.id) && (
                                        <RowActions
                                            onRename={() => {
                                                setRenameValue(project.name);
                                                setRenamingId(project.id);
                                            }}
                                            onUpdateCmNumber={() => {
                                                setCmValue(
                                                    project.cm_number ?? "",
                                                );
                                                setCmEditingId(project.id);
                                            }}
                                            onDelete={async () => {
                                                await deleteProject(project.id);
                                                setProjects((prev) =>
                                                    prev.filter(
                                                        (p) =>
                                                            p.id !== project.id,
                                                    ),
                                                );
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                            );
                        })}
                    </div>
                )}
            </div>
            </div>

            <NewProjectModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onCreated={(p) => {
                    setProjects((prev) => [p, ...prev]);
                    router.push(`/projects/${p.id}`);
                }}
            />

            <OwnerOnlyModal
                open={!!ownerOnlyAction}
                action={ownerOnlyAction ?? undefined}
                onClose={() => setOwnerOnlyAction(null)}
            />
        </div>
    );
}
