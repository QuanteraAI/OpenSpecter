"use client";

import React from "react";

type OpenSpecterIconVariant = "dark" | "white";

interface OpenSpecterIconProps {
    spin?: boolean;
    done?: boolean;
    error?: boolean;
    openSpecter?: boolean;
    size?: number;
    variant?: OpenSpecterIconVariant;
    className?: string;
    style?: React.CSSProperties;
}

export function OpenSpecterIcon({
    spin = false,
    done = false,
    error = false,
    openSpecter = false,
    size = 24,
    variant = "dark",
    className = "",
    style,
}: OpenSpecterIconProps) {
    void done;
    void error;
    void openSpecter;
    void variant;

    return (
        <span
            data-testid="app-logo"
            className={`shrink-0 inline-flex items-center justify-center animate-[spin_3s_linear_infinite] ${className}`}
            style={{
                width: size,
                height: size,
                animationPlayState: spin ? "running" : "paused",
                ...style,
            }}
            aria-hidden="true"
        >
            <img
                src="/brand/open-specter-logo-dark.png"
                alt=""
                width={size}
                height={size}
                draggable={false}
                style={{
                    display: "block",
                    width: size,
                    height: size,
                    objectFit: "contain",
                    imageRendering: "auto",
                }}
            />
        </span>
    );
}
