"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import {
    Search,
    Loader2,
    X,
    Image as ImageIcon,
    ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UnsplashImageSearchProps {
    editor: Editor;
    onClose: () => void;
    isOpen: boolean;
}

interface UnsplashPhoto {
    id: string;
    urls: {
        small: string;
        regular: string;
        thumb: string;
    };
    alt_description: string;
    user: {
        name: string;
        links: {
            html: string;
        };
    };
    links: {
        html: string;
    };
}

// Free Unsplash API (demo mode with limited requests)
// For production, get an API key from https://unsplash.com/developers
const UNSPLASH_ACCESS_KEY = "demo"; // Replace with real key for production

const SAMPLE_IMAGES: UnsplashPhoto[] = [
    {
        id: "1",
        urls: { 
            small: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400",
            regular: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
            thumb: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200"
        },
        alt_description: "Abstract gradient",
        user: { name: "Milad Fakurian", links: { html: "#" } },
        links: { html: "#" }
    },
    {
        id: "2",
        urls: { 
            small: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400",
            regular: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800",
            thumb: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200"
        },
        alt_description: "Gradient background",
        user: { name: "Gradienta", links: { html: "#" } },
        links: { html: "#" }
    },
    {
        id: "3",
        urls: { 
            small: "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=400",
            regular: "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=800",
            thumb: "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=200"
        },
        alt_description: "Mountain landscape",
        user: { name: "Bailey Zindel", links: { html: "#" } },
        links: { html: "#" }
    },
    {
        id: "4",
        urls: { 
            small: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400",
            regular: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
            thumb: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=200"
        },
        alt_description: "Snowy mountain",
        user: { name: "Benjamin Voros", links: { html: "#" } },
        links: { html: "#" }
    },
    {
        id: "5",
        urls: { 
            small: "https://images.unsplash.com/photo-1485470733090-0aae1788d5af?w=400",
            regular: "https://images.unsplash.com/photo-1485470733090-0aae1788d5af?w=800",
            thumb: "https://images.unsplash.com/photo-1485470733090-0aae1788d5af?w=200"
        },
        alt_description: "Ocean waves",
        user: { name: "Shifaaz shamoon", links: { html: "#" } },
        links: { html: "#" }
    },
    {
        id: "6",
        urls: { 
            small: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
            regular: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
            thumb: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"
        },
        alt_description: "Portrait",
        user: { name: "Joseph Gonzalez", links: { html: "#" } },
        links: { html: "#" }
    },
];

export function UnsplashImageSearch({ editor, onClose, isOpen }: UnsplashImageSearchProps) {
    const [query, setQuery] = useState("");
    const [images, setImages] = useState<UnsplashPhoto[]>(SAMPLE_IMAGES);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Search Unsplash
    const searchImages = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setImages(SAMPLE_IMAGES);
            return;
        }

        setIsLoading(true);

        try {
            // For demo, filter sample images by query
            // In production, use real Unsplash API:
            // const response = await fetch(
            //     `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=12`,
            //     { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
            // );
            // const data = await response.json();
            // setImages(data.results);

            // Demo: simulate search
            await new Promise(resolve => setTimeout(resolve, 500));
            const filtered = SAMPLE_IMAGES.filter(img => 
                img.alt_description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setImages(filtered.length > 0 ? filtered : SAMPLE_IMAGES);
        } catch (error) {
            console.error("Failed to search images:", error);
            setImages(SAMPLE_IMAGES);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) {
                searchImages(query);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, searchImages]);

    // Insert image into editor
    const insertImage = useCallback((photo: UnsplashPhoto) => {
        setSelectedImage(photo.id);
        
        editor
            .chain()
            .focus()
            .setImage({ 
                src: photo.urls.regular,
                alt: photo.alt_description || "Unsplash image",
                title: `Photo by ${photo.user.name} on Unsplash`
            })
            .run();

        // Close after short delay to show selection
        setTimeout(() => {
            onClose();
            setSelectedImage(null);
            setQuery("");
        }, 300);
    }, [editor, onClose]);

    // Handle keyboard
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            onClose();
        }
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                ref={containerRef}
                className="w-full max-w-2xl max-h-[80vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                onKeyDown={handleKeyDown}
            >
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-zinc-200 dark:border-zinc-700">
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <ImageIcon size={20} className="text-amber-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                            Insert Image from Unsplash
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Beautiful, free images from Unsplash
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Search Input */}
                <div className="p-4">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search for images..."
                            className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all placeholder:text-zinc-400"
                        />
                        {isLoading && (
                            <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-500 animate-spin" />
                        )}
                    </div>
                </div>

                {/* Image Grid - P2-005: Grid gap already at gap-3, adding better spacing */}
                <div className="px-4 pb-4 overflow-y-auto max-h-[50vh]">
                    <div className="grid grid-cols-3 gap-3.5">
                        {images.map((photo) => (
                            <button
                                key={photo.id}
                                onClick={() => insertImage(photo)}
                                className={cn(
                                    "relative aspect-video rounded-xl overflow-hidden group transition-all duration-200",
                                    selectedImage === photo.id
                                        ? "ring-2 ring-violet-500 ring-offset-2"
                                        : "hover:ring-2 hover:ring-violet-500/50 hover:ring-offset-1"
                                )}
                            >
                                <img
                                    src={photo.urls.small}
                                    alt={photo.alt_description || "Unsplash image"}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                />
                                
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <div className="absolute bottom-2 left-2 right-2 text-xs text-white truncate">
                                        {photo.user.name}
                                    </div>
                                </div>

                                {/* Selected indicator */}
                                {selectedImage === photo.id && (
                                    <div className="absolute inset-0 bg-violet-500/20 flex items-center justify-center">
                                        <Loader2 size={24} className="text-white animate-spin" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {images.length === 0 && !isLoading && (
                        <div className="text-center py-12 text-zinc-500">
                            <ImageIcon size={48} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No images found</p>
                            <p className="text-xs text-zinc-400 mt-1">Try a different search term</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-700 text-center">
                    <a
                        href="https://unsplash.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-violet-500 transition-colors"
                    >
                        Powered by Unsplash
                        <ExternalLink size={12} />
                    </a>
                </div>
            </div>
        </div>
    );
}

export default UnsplashImageSearch;
