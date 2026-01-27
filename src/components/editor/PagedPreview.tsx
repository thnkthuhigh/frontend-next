"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useDocumentStore } from "@/store/document-store";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStyleConfig } from "@/lib/document-styles";

// A4 dimensions for display
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_MARGIN_MM = 25;

interface PagedPreviewProps {
    onBackToEdit?: () => void;
}

export function PagedPreview({ onBackToEdit }: PagedPreviewProps) {
    const {
        title,
        subtitle,
        author,
        date,
        htmlContent,
        selectedStyle,
    } = useDocumentStore();

    const previewContainerRef = useRef<HTMLDivElement>(null);
    const sourceRef = useRef<HTMLDivElement>(null); // New ref for React rendered source
    const [isRendering, setIsRendering] = useState(true);
    const [pageCount, setPageCount] = useState(0);
    const [error, setError] = useState<string | null>(null);



    const styleConfig = getStyleConfig(selectedStyle);

    // Render with Paged.js
    const renderPreview = useCallback(async () => {
        if (!previewContainerRef.current || !sourceRef.current) return;

        setIsRendering(true);
        setError(null);

        try {
            // Clear previous content
            previewContainerRef.current.innerHTML = '';

            // Dynamically import Paged.js (client-side only)
            const { Previewer } = await import('pagedjs');

            const previewer = new Previewer();

            // Use the HTML rendered by React in the hidden source div
            const fullHTML = sourceRef.current.innerHTML;

            // Use Paged.js to paginate - pass HTML string and render target
            await previewer.preview(
                fullHTML,
                [], // stylesheets array (we use inline styles)
                previewContainerRef.current
            );

            // Get page count
            const pages = previewContainerRef.current.querySelectorAll('.pagedjs_page');
            setPageCount(pages.length);

        } catch (err) {
            console.error('Paged.js rendering error:', err);
            setError('Failed to render preview. Please try again.');
        } finally {
            setIsRendering(false);
        }
    }, []); // No dependencies needed as we read from DOM

    // Initial render when data changes
    useEffect(() => {
        // Debounce render to allow React to update sourceRef first
        const timer = setTimeout(() => {
            renderPreview();
        }, 100);
        return () => clearTimeout(timer);
    }, [title, subtitle, author, date, htmlContent, selectedStyle, renderPreview]);

    return (
        <div className="flex flex-col h-full">
            {/* Hidden Source for Paged.js (React renders this) */}
            <div className="hidden">
                <DocumentPrintLayout
                    ref={sourceRef}
                    title={title}
                    subtitle={subtitle}
                    author={author}
                    date={date}
                    htmlContent={htmlContent}
                    styleConfig={styleConfig}
                />
            </div>

            {/* Preview Toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-border bg-card/50">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onBackToEdit}
                    >
                        ← Back to Edit
                    </Button>
                    <div className="h-4 w-px bg-border" />
                    <span className="text-sm text-muted-foreground">
                        {isRendering ? 'Rendering...' : `${pageCount} pages`}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={renderPreview}
                    disabled={isRendering}
                >
                    <RefreshCw size={16} className={isRendering ? 'animate-spin' : ''} />
                    <span className="ml-2">Refresh</span>
                </Button>
            </div>

            {/* Preview Container */}
            <div className="flex-1 overflow-auto bg-neutral-200 dark:bg-neutral-800 p-8">
                {isRendering && (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Generating page preview...</p>
                    </div>
                )}

                {error && (
                    <div className="flex flex-col items-center justify-center h-64 text-red-500">
                        <p>{error}</p>
                        <Button variant="outline" className="mt-4" onClick={renderPreview}>
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Paged.js output container */}
                <div
                    ref={previewContainerRef}
                    className="paged-preview-container mx-auto"
                    style={{
                        visibility: isRendering ? 'hidden' : 'visible',
                    }}
                />
            </div>
        </div>
    );
}

import { DocumentPrintLayout } from "@/components/print/DocumentPrintLayout";

export default PagedPreview;
