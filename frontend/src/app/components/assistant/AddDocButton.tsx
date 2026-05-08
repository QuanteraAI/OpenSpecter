"use client";

import { useRef, useState } from "react";
import { PlusIcon, Upload, LayoutGridIcon, Loader2Icon } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { uploadStandaloneDocument } from "@/app/lib/openSpecterApi";
import type { OpenSpecterDocument } from "../shared/types";

interface Props {
    onSelectDoc: (doc: OpenSpecterDocument) => void;
    onBrowseAll: () => void;
    selectedDocIds?: string[];
}

export function AddDocButton({ onSelectDoc, onBrowseAll, selectedDocIds = [] }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setUploading(true);
        try {
            const uploaded = await Promise.all(
                files.map((f) => uploadStandaloneDocument(f)),
            );
            uploaded.forEach((doc) => onSelectDoc(doc));
        } catch (err) {
            console.error("Upload failed:", err);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc"
                multiple
                className="hidden"
                onChange={handleUpload}
            />
            <DropdownMenu onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <button
                        className={`flex h-8 items-center gap-1 rounded-md px-2 font-space-grotesk text-sm font-[520] transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 ${
                            selectedDocIds.length > 0
                                ? "bg-muted text-foreground hover:bg-muted/80"
                                : "text-muted-foreground hover:bg-muted/65 hover:text-foreground"
                        } ${isOpen ? "bg-muted text-foreground" : ""}`}
                        title="Add documents"
                        aria-label="Add documents"
                    >
                        {selectedDocIds.length > 0 ? (
                            <span className="font-medium tabular-nums">{selectedDocIds.length}</span>
                        ) : (
                            <PlusIcon
                                className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-[135deg]" : ""}`}
                            />
                        )}
                        <span className="hidden sm:inline">
                            {selectedDocIds.length === 1
                                ? "Document"
                                : "Documents"}
                        </span>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="w-44 z-50"
                    side="bottom"
                    align="start"
                >
                    <DropdownMenuItem
                        className="cursor-pointer"
                        disabled={uploading}
                        onSelect={(e) => {
                            e.preventDefault();
                            fileInputRef.current?.click();
                        }}
                    >
                        {uploading ? (
                            <Loader2Icon className="h-4 w-4 mr-2 animate-spin text-gray-400" />
                        ) : (
                            <Upload className="h-4 w-4 mr-2 text-gray-500" />
                        )}
                        <span className="text-sm">
                            {uploading ? "Uploading…" : "Upload files"}
                        </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={onBrowseAll}
                    >
                        <LayoutGridIcon className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">Browse all</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}
