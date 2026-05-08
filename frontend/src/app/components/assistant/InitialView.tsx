"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { OpenSpecterIcon } from "@/components/chat/open-specter-icon";
import { ChatInput } from "./ChatInput";
import { RecentActivity } from "./RecentActivity";
import { SelectAssistantProjectModal } from "./SelectAssistantProjectModal";
import type { OpenSpecterMessage } from "../shared/types";

interface InitialViewProps {
    onSubmit: (message: OpenSpecterMessage) => void;
}

export function InitialView({ onSubmit }: InitialViewProps) {
    const { user } = useAuth();
    const { profile } = useUserProfile();
    const [projectModalOpen, setProjectModalOpen] = useState(false);

    const username =
        profile?.displayName?.trim() || user?.email?.split("@")[0] || "there";

    return (
        <div className="flex h-full w-full flex-col px-4 sm:px-6">
            <div className="flex flex-1 flex-col items-center justify-center py-8">
                <div className="relative w-full max-w-4xl px-0 xl:px-8">
                    <div
                        data-testid="assistant-home-welcome"
                        className="mb-8 flex items-center justify-center gap-4 text-center"
                    >
                        <OpenSpecterIcon size={40} />
                        <h1 className="font-space-grotesk text-4xl font-[520] tracking-[-0.04em] text-gray-950 sm:text-5xl">
                            Hi, {username}
                        </h1>
                    </div>

                    <ChatInput
                        onSubmit={onSubmit}
                        onCancel={() => {}}
                        isLoading={false}
                        onProjectsClick={() => setProjectModalOpen(true)}
                    />

                    <RecentActivity />
                </div>
            </div>

            <p
                className="shrink-0 pb-4 text-center text-xs text-muted-foreground"
                data-testid="assistant-home-ai-disclaimer"
            >
                AI can make mistakes. Answers are not legal advice.
            </p>

            <SelectAssistantProjectModal
                open={projectModalOpen}
                onClose={() => setProjectModalOpen(false)}
            />
        </div>
    );
}
