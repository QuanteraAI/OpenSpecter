"use client";

import { useState, useEffect, useRef } from "react";
import {
    PanelLeft,
    MessageSquare,
    FolderOpen,
    Table2,
    Library,
    ChevronsUpDown,
    ChevronDown,
    Settings,
    LogOut,
    Keyboard,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useChatHistoryContext } from "@/app/contexts/ChatHistoryContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { OpenSpecterIcon } from "@/components/chat/open-specter-icon";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { SidebarChatItem } from "@/app/components/shared/SidebarChatItem";
import { KeyboardShortcutsSheet } from "@/app/components/shared/KeyboardShortcutsSheet";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { listProjects } from "@/app/lib/openSpecterApi";

const NAV_ITEMS = [
    { id: "assistant", href: "/assistant", label: "Assistant", icon: MessageSquare, shortcut: "⌘ 1" },
    { id: "projects", href: "/projects", label: "Projects", icon: FolderOpen, shortcut: "⌘ 2" },
    { id: "tabular-reviews", href: "/tabular-reviews", label: "Tabular Review", icon: Table2, shortcut: "⌘ 3" },
    { id: "workflows", href: "/workflows", label: "Workflows", icon: Library, shortcut: "⌘ 4" },
];

interface AppSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

export function AppSidebar({ isOpen, onToggle }: AppSidebarProps) {
    const { user, signOut } = useAuth();
    const { profile } = useUserProfile();
    const { chats, currentChatId, setCurrentChatId } = useChatHistoryContext();
    const router = useRouter();
    const pathname = usePathname();
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const [historyCollapsed, setHistoryCollapsed] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement | null>(null);
    const prefersReducedMotion = useReducedMotion();
    const [projectNames, setProjectNames] = useState<Record<string, string>>(
        {},
    );

    useEffect(() => {
        if (!user) return;
        listProjects()
            .then((projects) => {
                const map: Record<string, string> = {};
                for (const p of projects) map[p.id] = p.name;
                setProjectNames(map);
            })
            .catch(() => {});
    }, [user]);

    useEffect(() => {
        if (!isOpen) setShouldAnimate(true);
    }, [isOpen]);

    useEffect(() => {
        if (pathname.startsWith("/assistant/chat/")) {
            const chatId = pathname.split("/").pop() ?? null;
            setCurrentChatId(chatId);
            return;
        }

        const projectChatMatch = pathname.match(
            /^\/projects\/[^/]+\/assistant\/chat\/([^/]+)/,
        );
        if (projectChatMatch) {
            setCurrentChatId(projectChatMatch[1]);
            return;
        }

        if (pathname === "/assistant") {
            setCurrentChatId(null);
        }
    }, [pathname, setCurrentChatId]);

    useEffect(() => {
        if (!isUserMenuOpen) return;
        const handlePointerDown = (event: PointerEvent) => {
            if (!userMenuRef.current?.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsUserMenuOpen(false);
        };
        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isUserMenuOpen]);

    useEffect(() => {
        const isEditableTarget = (target: EventTarget | null) => {
            if (!(target instanceof HTMLElement)) return false;
            const tag = target.tagName.toLowerCase();
            return (
                tag === "input" ||
                tag === "textarea" ||
                tag === "select" ||
                target.isContentEditable
            );
        };

        const handleShortcut = (event: KeyboardEvent) => {
            const modifier = event.metaKey || event.ctrlKey;
            if (!modifier) {
                if (event.key === "Escape" && shortcutsOpen) {
                    event.preventDefault();
                    setShortcutsOpen(false);
                }
                return;
            }

            const key = event.key.toLowerCase();
            const editable = isEditableTarget(event.target);

            if (key === "/") {
                event.preventDefault();
                setShortcutsOpen(true);
                setIsUserMenuOpen(false);
                return;
            }
            if (key === "b") {
                event.preventDefault();
                onToggle();
                return;
            }
            if (key === ",") {
                event.preventDefault();
                router.push("/account");
                return;
            }
            if (key === "j") {
                event.preventDefault();
                router.push("/assistant");
                requestAnimationFrame(() => {
                    document
                        .querySelector<HTMLTextAreaElement>(
                            '[data-testid="assistant-prompt-textarea"]',
                        )
                        ?.focus();
                });
                return;
            }

            if (editable) return;

            const routes: Record<string, string> = {
                "1": "/assistant",
                "2": "/projects",
                "3": "/tabular-reviews",
                "4": "/workflows",
                n: "/assistant",
            };
            const route = routes[key];
            if (route) {
                event.preventDefault();
                router.push(route);
            }
        };

        window.addEventListener("keydown", handleShortcut);
        return () => window.removeEventListener("keydown", handleShortcut);
    }, [onToggle, router, shortcutsOpen]);

    const getUserInitials = (email: string) => {
        if (profile?.displayName)
            return profile.displayName.charAt(0).toUpperCase();
        return email.charAt(0).toUpperCase();
    };

    const getDisplayName = () => {
        if (!profile) return "";
        return profile.displayName || user?.email?.split("@")[0] || "";
    };

    const getUserTier = () => {
        if (!profile) return "";
        return profile.tier || "Free";
    };

    if (!user) return null;

    return (
        <div className="contents">
            <TooltipProvider delayDuration={0} skipDelayDuration={0} disableHoverableContent>
            <div
                className={`${
                isOpen
                    ? "w-64 h-dvh bg-gray-50 border-r"
                    : "w-14 md:h-dvh md:bg-gray-50 md:border-r h-auto bg-transparent"
            } border-gray-200 flex flex-col transition-[width,background-color,border-color] duration-300 absolute md:relative z-40 overflow-hidden md:overflow-visible`}
        >
            {/* Toggle + Logo */}
            <div
                className={`mb-3 items-center justify-between px-2.5 py-2 ${
                    !isOpen ? "hidden md:flex" : "flex"
                }`}
            >
                {isOpen && (
                    <div className="min-w-0 overflow-hidden px-2.5">
                        <Link
                            href="/assistant"
                            className="flex min-w-0 items-center gap-1.5 overflow-hidden hover:opacity-80 transition-opacity"
                        >
                            <OpenSpecterIcon size={22} />
                            <span
                                className={`shrink-0 whitespace-nowrap text-2xl leading-none font-space-grotesk font-[520] tracking-[-0.03em] ${
                                    shouldAnimate ? "sidebar-fade-in" : ""
                                }`}
                            >
                                Open Specter
                            </span>
                        </Link>
                    </div>
                )}
                <button
                    onClick={onToggle}
                    className="h-9 w-9 p-2.5 items-center flex hover:bg-gray-100 rounded-md transition-colors"
                    title={isOpen ? "Close sidebar" : "Open sidebar"}
                >
                    <PanelLeft className="h-4 w-4" />
                </button>
            </div>

            {/* Nav items */}
            {NAV_ITEMS.map(({ id, href, label, icon: Icon, shortcut }) => {
                const isActive =
                    pathname === href || pathname.startsWith(href + "/");
                return (
                    <div key={href} className="py-1 px-2.5">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    data-testid={`sidebar-nav-${id}`}
                                    onClick={() => router.push(href)}
                                    className={`w-full h-9 flex items-center gap-3 px-2.5 py-2 rounded-md transition-[background-color,color] duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 ${
                                        isActive
                                            ? "bg-gray-100 text-gray-900"
                                            : "hover:bg-gray-100 text-gray-700"
                                    } ${!isOpen ? "hidden md:flex" : "flex"}`}
                                >
                                    <Icon
                                        className={`h-4 w-4 flex-shrink-0 ${
                                            isActive ? "text-gray-900" : "text-black"
                                        }`}
                                    />
                                    {isOpen && (
                                        <span
                                            className={`whitespace-nowrap text-sm font-medium ${
                                                shouldAnimate ? "sidebar-fade-in-2" : ""
                                            }`}
                                        >
                                            {label}
                                        </span>
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent
                                side="right"
                                align="center"
                                className="z-[2147483647] rounded-xl border-border bg-white px-2.5 py-2 text-gray-900 shadow-[0_14px_34px_rgba(2,6,23,0.14)]"
                                data-testid={`sidebar-nav-tooltip-${id}`}
                            >
                                <div className="flex min-w-40 items-center justify-between gap-4">
                                    <span className="font-space-grotesk text-sm font-[520] tracking-[-0.01em]">
                                        {label}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-space-grotesk text-[11px] font-[520] text-gray-600">
                                        <Keyboard className="size-3" />
                                        {shortcut}
                                    </span>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                );
            })}

            {/* Assistant History */}
            {isOpen && pathname.startsWith("/assistant") && (
                <div className="mt-4 flex-1 min-h-0 flex flex-col">
                    <button
                        onClick={() => setHistoryCollapsed((v) => !v)}
                        className={`mb-2 px-5 flex items-center justify-between text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors ${
                            shouldAnimate ? "sidebar-fade-in" : ""
                        }`}
                    >
                        <span>Assistant History</span>
                        <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform ${historyCollapsed ? "-rotate-90" : ""}`}
                        />
                    </button>
                    <div
                        className={`overflow-y-auto flex-1 ${historyCollapsed ? "hidden" : ""}`}
                    >
                        {!chats ? (
                            <div className="space-y-1 px-2.5">
                                {[40, 60, 50, 70, 45].map((w, i) => (
                                    <div
                                        key={i}
                                        className="h-9 flex items-center px-3 rounded-md"
                                    >
                                        <div
                                            className="h-3 bg-gray-200 rounded animate-pulse"
                                            style={{ width: `${w}%` }}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : chats.length === 0 ? (
                            <div
                                className={`text-xs text-gray-500 py-2 px-5 ${
                                    shouldAnimate ? "sidebar-fade-in-2" : ""
                                }`}
                            >
                                No chats yet
                            </div>
                        ) : (
                            <div
                                className={`space-y-1 px-2.5 ${
                                    shouldAnimate ? "sidebar-fade-in-2" : ""
                                }`}
                            >
                                {chats.map((chat) => (
                                    <SidebarChatItem
                                        key={chat.id}
                                        chat={chat}
                                        isActive={currentChatId === chat.id}
                                        projectName={
                                            chat.project_id
                                                ? projectNames[chat.project_id]
                                                : undefined
                                        }
                                        onSelect={() => {
                                            setCurrentChatId(chat.id);
                                            router.push(
                                                chat.project_id
                                                    ? `/projects/${chat.project_id}/assistant/chat/${chat.id}`
                                                    : `/assistant/chat/${chat.id}`,
                                            );
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* User Profile */}
            <div className="relative mt-auto" ref={userMenuRef}>
                {user && (
                    <>
                        <button
                            type="button"
                            data-testid="sidebar-user-menu-trigger"
                            onClick={() => setIsUserMenuOpen((open) => !open)}
                            aria-expanded={isUserMenuOpen}
                            aria-haspopup="menu"
                            className={`flex w-full items-center border-t border-gray-200 px-3.5 py-4 transition-[background-color,transform] duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 ${
                                !isOpen ? "hidden md:flex" : ""
                            } ${
                                pathname.startsWith("/account") || isUserMenuOpen
                                    ? "bg-gray-100"
                                    : "hover:bg-gray-100"
                            }`}
                            title={!isOpen ? user.email : undefined}
                        >
                            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-800 font-space-grotesk text-sm font-medium text-white">
                                {getUserInitials(user.email)}
                            </div>
                            {isOpen && (
                                <div
                                    className={`flex min-w-0 flex-1 items-center justify-between gap-2 pl-3 text-left ${
                                        shouldAnimate ? "sidebar-fade-in-2" : ""
                                    }`}
                                >
                                    <div className="flex min-w-0 flex-col gap-0.5">
                                        <div className="truncate font-space-grotesk text-sm font-[550] leading-none text-gray-900">
                                            {getDisplayName()}
                                        </div>
                                        <div className="text-[12px] leading-none text-gray-500">
                                            {getUserTier()}
                                        </div>
                                    </div>
                                    <ChevronsUpDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
                                </div>
                            )}
                        </button>

                        <AnimatePresence>
                            {isUserMenuOpen && (
                                <motion.div
                                    data-testid="sidebar-user-menu-content"
                                    role="menu"
                                    initial={
                                        prefersReducedMotion
                                            ? { opacity: 1 }
                                            : { opacity: 0, y: 8, scale: 0.98 }
                                    }
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={
                                        prefersReducedMotion
                                            ? { opacity: 0 }
                                            : { opacity: 0, y: 6, scale: 0.985 }
                                    }
                                    transition={{ duration: 0.16, ease: "easeOut" }}
                                    className={`absolute bottom-full z-[2147483000] mb-2 overflow-hidden rounded-2xl border border-border bg-background p-1.5 shadow-[0_18px_50px_rgba(2,6,23,0.16)] ${
                                        isOpen ? "left-2 right-2" : "left-2 w-60"
                                    }`}
                                >
                                    <button
                                        type="button"
                                        role="menuitem"
                                        data-testid="sidebar-user-menu-account-settings"
                                        onClick={() => {
                                            setIsUserMenuOpen(false);
                                            router.push("/account");
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition-[background-color] duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                                    >
                                        <Settings className="size-4 text-muted-foreground" />
                                        Account settings
                                    </button>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        data-testid="sidebar-user-menu-shortcuts"
                                        onClick={() => {
                                            setIsUserMenuOpen(false);
                                            setShortcutsOpen(true);
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition-[background-color] duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                                    >
                                        <Keyboard className="size-4 text-muted-foreground" />
                                        Shortcuts
                                    </button>
                                    <div className="my-1 h-px bg-border" />
                                    <button
                                        type="button"
                                        role="menuitem"
                                        data-testid="sidebar-user-menu-sign-out"
                                        onClick={async () => {
                                            setIsUserMenuOpen(false);
                                            await signOut();
                                            router.push("/");
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition-[background-color] duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                                    >
                                        <LogOut className="size-4 text-muted-foreground" />
                                        Sign out
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>
            </div>
            </TooltipProvider>

            <KeyboardShortcutsSheet
                open={shortcutsOpen}
                onClose={() => setShortcutsOpen(false)}
            />
        </div>
    );
}
