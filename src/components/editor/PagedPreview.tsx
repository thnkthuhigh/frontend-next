"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useDocumentStore } from "@/store/document-store";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStyleConfig } from "@/lib/document-styles";
import { DocumentPrintLayout } from "@/components/print/DocumentPrintLayout";

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
    const sourceRef = useRef<HTMLDivElement>(null);
    const [isRendering, setIsRendering] = useState(true);
    const [pageCount, setPageCount] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const styleConfig = getStyleConfig(selectedStyle);

    // Render with Paged.js
    const renderPreview = useCallback(async () => {
        if (!previewContainerRef.current || !sourceRef.current) return;

        setIsRendering(true);
        setError(null);

        // Clear previous output
        previewContainerRef.current.innerHTML = '';

        try {
            // Dynamic import of Paged.js (client-side only)
            const { Previewer } = await import('pagedjs');
            
            const previewer = new Previewer();
            
            // Get HTML from the hidden source rendered by React
            const sourceHTML = sourceRef.current.innerHTML;

            // Paged.js pagination - renders paginated content into the container
            await previewer.preview(
                sourceHTML,
                [], // stylesheets included via global CSS
                previewContainerRef.current
            );

            // Count pages
            const pages = previewContainerRef.current.querySelectorAll('.pagedjs_page');
            setPageCount(pages.length);

        } catch (err) {
            console.error("Paged.js pagination failed:", err);
            setError("Pagination failed. Showing fallback preview.");
            
            // Fallback: just copy the source content
            if (previewContainerRef.current && sourceRef.current) {
                previewContainerRef.current.innerHTML = `
                    <div class="fallback-preview" style="background: white; padding: 25mm; max-width: 210mm; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                        ${sourceRef.current.innerHTML}
                    </div>
                `;
                setPageCount(1);
            }
        } finally {
            setIsRendering(false);
        }
    }, []);

    // Trigger render when content changes
    useEffect(() => {
        // Debounce to allow React to update sourceRef first
        const timer = setTimeout(() => {
            renderPreview();
        }, 150);
        return () => clearTimeout(timer);
    }, [title, subtitle, author, date, htmlContent, selectedStyle, renderPreview]);

    return (
        <div className="flex flex-col h-full">
            {/* Hidden Source: This is what we feed to Paged.js */}
            <div style={{ position: 'absolute', left: '-9999px', visibility: 'hidden' }}>
                <DocumentPrintLayout
                    ref={sourceRef}
                    title={title}
                    subtitle={subtitle}
                    author={author}
                    date={date}
                    htmlContent={htmlContent || '<p>No content yet.</p>'}
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
                        {isRendering ? 'Rendering...' : `${pageCount} page${pageCount !== 1 ? 's' : ''}`}
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

                {error && !isRendering && (
                    <div className="text-center text-amber-600 text-sm mb-4">
                        {error}
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

export default PagedPreview;
