"use client";

import { cn } from "@/lib/utils";

interface ThinkingTextProps {
    label?: string;
    testId?: string;
    className?: string;
}

export const ThinkingText = ({
    label = "thinking",
    testId = "thinking-shimmer-text",
    className,
}: ThinkingTextProps) => {
    return (
        <span
            data-testid={testId}
            className={cn(
                "inline-flex bg-gradient-to-r from-gray-400 via-gray-950 to-gray-400 bg-[length:200%_100%] bg-clip-text font-space-grotesk text-sm font-[520] tracking-[-0.01em] text-transparent animate-[shimmer_1.8s_linear_infinite]",
                className,
            )}
        >
            {label}
        </span>
    );
};
