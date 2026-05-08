import Link from "next/link";
import { OpenSpecterIcon } from "@/components/chat/open-specter-icon";

interface SiteLogoProps {
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
    animate?: boolean;
    asLink?: boolean;
}

export function SiteLogo({
    size = "md",
    className = "",
    animate = false,
    asLink = false,
}: SiteLogoProps) {
    const landingHref =
        process.env.NODE_ENV === "production"
            ? "https://openspecter.com"
            : "http://localhost:3000";
    const sizeClasses = {
        sm: "text-xl",
        md: "text-2xl",
        lg: "text-4xl",
        xl: "text-6xl",
    };

    const iconSizes = {
        sm: 24,
        md: 36,
        lg: 56,
        xl: 80,
    };

    const logo = (
        <h1
            className={`flex items-center gap-1.5 ${sizeClasses[size]} font-space-grotesk font-[520] tracking-[-0.03em] ${
                animate ? "sidebar-fade-in" : ""
            } ${className}`}
        >
            <OpenSpecterIcon size={iconSizes[size]} />
            <span>Open Specter</span>
        </h1>
    );

    if (asLink) {
        return (
            <Link
                href={landingHref}
                className="cursor-pointer hover:opacity-80 transition-opacity"
            >
                {logo}
            </Link>
        );
    }

    return logo;
}
