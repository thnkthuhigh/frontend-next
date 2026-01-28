"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useDocumentStore } from "@/store/document-store";
import {
    Loader2, Printer, Download, ZoomIn, ZoomOut,
    ChevronLeft, ChevronRight, FileText, Maximize2, Minimize2,
    Scissors, Undo2, X, Merge
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getStyleConfig } from "@/lib/document-styles";
import { formatStructure, downloadBlob } from "@/lib/api";
import { buildPdfHtml } from "@/lib/pdf-utils";
import { generateHtmlFromJson } from "@/lib/html-generator";

interface PagedPreviewProps {
    onBackToEdit?: () => void;
}

// A4 dimensions - EXACT match with Playwright PDF settings
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_MARGIN_MM = 25;
const A4_CONTENT_WIDTH_MM = A4_WIDTH_MM - (A4_MARGIN_MM * 2);
const A4_CONTENT_HEIGHT_MM = A4_HEIGHT_MM - (A4_MARGIN_MM * 2);

// Pixel conversion at 96 DPI
const MM_TO_PX = 96 / 25.4;
const A4_CONTENT_HEIGHT_PX = A4_CONTENT_HEIGHT_MM * MM_TO_PX;

// Base styles consistent with what Playwright uses (or what we want it to use)
import { getPdfStyles } from "@/lib/shared-styles";

// Base styles are now imported from shared-styles.ts for consistency
function getPdfContentStyles(styleConfig: ReturnType<typeof getStyleConfig>): string {
    return getPdfStyles(styleConfig);
}


// Block elements that can have page breaks inserted before them
const BREAKABLE_SELECTORS = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, pre, table, div:not(.page-break):not(.measure-container)';

// Toast notification component
function Toast({ message, onUndo, onClose }: { message: string; onUndo?: () => void; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl"
                style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Scissors size={16} className="text-blue-400" />
                <span className="text-white text-sm font-medium">{message}</span>
                {onUndo && (
                    <button onClick={onUndo}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-medium transition-all">
                        <Undo2 size={12} />
                        Undo
                    </button>
                )}
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all">
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}

export function PagedPreview({ onBackToEdit }: PagedPreviewProps) {
    const { title, subtitle, author, date, htmlContent, jsonContent, selectedStyle, setHtmlContent } = useDocumentStore();

    const effectiveHtml = useMemo(() => {
        if (htmlContent && htmlContent.trim() !== '' && htmlContent !== '<p></p>') return htmlContent;
        if (jsonContent) return generateHtmlFromJson(jsonContent);
        return '';
    }, [htmlContent, jsonContent]);

    const [isRendering, setIsRendering] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [pages, setPages] = useState<{ content: string; hasManualBreak: boolean; breakIndex: number }[]>([]);
    const [zoom, setZoom] = useState(65);
    const [currentPage, setCurrentPage] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const measureIframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const styleConfig = getStyleConfig(selectedStyle);

    // Magic Break Handle state
    const [hoveredElement, setHoveredElement] = useState<{ element: HTMLElement; rect: DOMRect } | null>(null);
    const [toast, setToast] = useState<{ message: string; previousHtml: string } | null>(null);
    const pagesContainerRef = useRef<HTMLDivElement>(null);
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isMouseOverHandleRef = useRef(false);

    const fullPdfHtml = useMemo(() => {
        return buildPdfHtml(effectiveHtml, styleConfig, title, subtitle, author, date);
    }, [effectiveHtml, styleConfig, title, subtitle, author, date]);

    const measurementHtml = useMemo(() => {
        const styles = getPdfContentStyles(styleConfig);
        return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
${styles}
</style>
</head>
<body>
<div class="measure-container">${effectiveHtml}</div>
</body>
</html>`;
    }, [effectiveHtml, styleConfig]);

    const paginateContent = useCallback(() => {
        const iframe = measureIframeRef.current;
        if (!iframe?.contentDocument?.body || !effectiveHtml) {
            setPages([{ content: effectiveHtml || '<p>No content</p>', hasManualBreak: false, breakIndex: -1 }]);
            return;
        }
        const container = iframe.contentDocument.querySelector('.measure-container');
        if (!container) { setPages([{ content: effectiveHtml, hasManualBreak: false, breakIndex: -1 }]); return; }

        const children = Array.from(container.children) as HTMLElement[];
        if (children.length === 0) {
            setPages([{ content: effectiveHtml, hasManualBreak: false, breakIndex: -1 }]);
            return;
        }

        const pagesResult: { content: string; hasManualBreak: boolean; breakIndex: number }[] = [];
        let currentPageContent: string[] = [];
        let currentHeight = 0;
        let prevMarginBottom = 0;
        let nextPageHasManualBreak = false;
        let currentBreakIndex = -1;
        let breakCounter = 0;

        // Calculate available height at 96 DPI
        // A4 content height = 247mm = 934.4px at 96 DPI
        const AVAILABLE_HEIGHT = A4_CONTENT_HEIGHT_PX;

        for (let i = 0; i < children.length; i++) {
            const child = children[i];

            // Check for manual page break
            if (child.classList.contains('page-break') || child.hasAttribute('data-page-break')) {
                // Force a page break
                if (currentPageContent.length > 0) {
                    pagesResult.push({
                        content: currentPageContent.join(''),
                        hasManualBreak: nextPageHasManualBreak,
                        breakIndex: currentBreakIndex
                    });
                    currentPageContent = [];
                    currentHeight = 0;
                    prevMarginBottom = 0; // Reset margin context
                }
                nextPageHasManualBreak = true;
                currentBreakIndex = breakCounter;
                breakCounter++;
                continue;
            }

            const style = iframe.contentWindow!.getComputedStyle(child);
            const marginTop = parseFloat(style.marginTop) || 0;
            const marginBottom = parseFloat(style.marginBottom) || 0;
            const rect = child.getBoundingClientRect();

            // LOGIC FIX: Implement CSS Margin Collapse
            // If this is the first element on the page, use its top margin (or 0 if at very top).
            // Otherwise, the space between is max(prevBottom, currentTop).

            let addedSpace = 0;

            if (currentPageContent.length === 0) {
                // First element on page - usually margins collapse with top of container (effectively 0)
                // BUT if we want to preserve h1 top margin, we include it. 
                // However, standard printing usually strips top margin of first element.
                // Let's assume explicit top margin is kept, but it doesn't collapse with "nothing".
                addedSpace = marginTop;
            } else {
                // Collapsing margins
                addedSpace = Math.max(prevMarginBottom, marginTop);
            }

            const elementSegmentHeight = addedSpace + rect.height;
            // Note: We don't add marginBottom yet, it's saved for the NEXT element's collapse calculation.
            // But we must check if including this element's height (+ its bottom margin if it's the last) fits.
            // Actually, simply checking height + space is enough. 

            // If adding this child exceeds the page height, start a new page
            if (currentHeight + elementSegmentHeight > AVAILABLE_HEIGHT && currentPageContent.length > 0) {
                pagesResult.push({
                    content: currentPageContent.join(''),
                    hasManualBreak: nextPageHasManualBreak,
                    breakIndex: currentBreakIndex
                });
                currentPageContent = [];
                currentHeight = 0;
                prevMarginBottom = 0;
                nextPageHasManualBreak = false;
                currentBreakIndex = -1;

                // On new page, treat as first element
                // Recalculate space for new page context (marginTop only)
                const newPageElementSpace = marginTop + rect.height;
                currentPageContent.push(child.outerHTML);
                currentHeight += newPageElementSpace;
                prevMarginBottom = marginBottom;
            }
            // If a single element is larger than the page
            else if (elementSegmentHeight > AVAILABLE_HEIGHT && currentPageContent.length === 0) {
                pagesResult.push({ content: child.outerHTML, hasManualBreak: nextPageHasManualBreak, breakIndex: currentBreakIndex });
                currentHeight = 0;
                prevMarginBottom = 0;
                nextPageHasManualBreak = false;
                currentBreakIndex = -1;
            }
            else {
                currentPageContent.push(child.outerHTML);
                currentHeight += elementSegmentHeight;
                prevMarginBottom = marginBottom;
            }
        }

        if (currentPageContent.length > 0) {
            pagesResult.push({
                content: currentPageContent.join(''),
                hasManualBreak: nextPageHasManualBreak,
                breakIndex: currentBreakIndex
            });
        }
        setPages(pagesResult.length > 0 ? pagesResult : [{ content: effectiveHtml, hasManualBreak: false, breakIndex: -1 }]);
    }, [effectiveHtml]);

    const handleMeasureIframeLoad = useCallback(() => {
        // Wait for fonts and layout to settle before measuring
        const iframe = measureIframeRef.current;
        if (iframe?.contentDocument) {
            // Check if document has loaded fonts
            if (iframe.contentDocument.fonts?.ready) {
                iframe.contentDocument.fonts.ready.then(() => {
                    setTimeout(() => { paginateContent(); setIsRendering(false); }, 100);
                });
            } else {
                setTimeout(() => { paginateContent(); setIsRendering(false); }, 300);
            }
        } else {
            setTimeout(() => { paginateContent(); setIsRendering(false); }, 300);
        }
    }, [paginateContent]);

    useEffect(() => { setIsRendering(true); }, [effectiveHtml, measurementHtml]);

    // Magic Break Handle: Hover detection for content pages
    const handlePageMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>, pageIndex: number) => {
        // Skip cover page (pageIndex 0 is handled separately)
        if (pageIndex < 0) return;

        const pageElement = e.currentTarget;
        const target = e.target as HTMLElement;

        // Find the closest breakable block element
        const blockElement = target.closest(BREAKABLE_SELECTORS) as HTMLElement | null;

        if (blockElement && pageElement.contains(blockElement)) {
            // Don't show handle for page-break elements themselves
            if (blockElement.classList.contains('page-break')) {
                setHoveredElement(null);
                return;
            }

            const rect = blockElement.getBoundingClientRect();
            setHoveredElement({ element: blockElement, rect });
        } else {
            setHoveredElement(null);
        }
    }, []);

    const handlePageMouseLeave = useCallback(() => {
        // Debounce hide - allow time for mouse to reach the handle
        hideTimerRef.current = setTimeout(() => {
            if (!isMouseOverHandleRef.current) {
                setHoveredElement(null);
            }
        }, 150);
    }, []);

    // Cancel hide timer when mouse enters the handle
    const handleMouseEnterHandle = useCallback(() => {
        isMouseOverHandleRef.current = true;
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
    }, []);

    // Hide handle when mouse leaves the handle area
    const handleMouseLeaveHandle = useCallback(() => {
        isMouseOverHandleRef.current = false;
        hideTimerRef.current = setTimeout(() => {
            setHoveredElement(null);
        }, 100);
    }, []);

    // Remove existing page break
    const removePageBreak = useCallback((breakIndex: number) => {
        const previousHtml = effectiveHtml;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = effectiveHtml;

        const pageBreaks = tempDiv.querySelectorAll('.page-break, [data-page-break="true"]');
        if (pageBreaks[breakIndex]) {
            pageBreaks[breakIndex].remove();
            const newHtml = tempDiv.innerHTML;
            setHtmlContent(newHtml);
            setToast({ message: 'Page break removed', previousHtml });
        }
    }, [effectiveHtml, setHtmlContent]);

    // Get list of page break positions for rendering delete handles
    const pageBreakPositions = useMemo(() => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = effectiveHtml;
        const breaks = tempDiv.querySelectorAll('.page-break, [data-page-break="true"]');
        return Array.from(breaks).length;
    }, [effectiveHtml]);

    // Magic Break Handle: Inject page break before target element
    const injectPageBreak = useCallback((targetElement: HTMLElement) => {
        if (!targetElement) return;

        // Store current HTML for undo
        const previousHtml = effectiveHtml;

        // Get the outer HTML of the target element
        const targetHtml = targetElement.outerHTML;

        // Find the position of this element in effectiveHtml
        // We need to be careful about duplicate elements
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = effectiveHtml;

        // Find all matching elements and try to identify the correct one
        const allElements = tempDiv.querySelectorAll(targetElement.tagName.toLowerCase());
        let matchedElement: Element | null = null;

        for (const el of allElements) {
            // Compare content to find the right element
            if (el.textContent?.trim() === targetElement.textContent?.trim()) {
                matchedElement = el;
                break;
            }
        }

        if (matchedElement) {
            // Create page break element
            const pageBreakDiv = document.createElement('div');
            pageBreakDiv.className = 'page-break';
            pageBreakDiv.setAttribute('data-page-break', 'true');

            // Insert before the matched element
            matchedElement.parentNode?.insertBefore(pageBreakDiv, matchedElement);

            // Get the new HTML
            const newHtml = tempDiv.innerHTML;

            // Update the store
            setHtmlContent(newHtml);

            // Show toast
            setToast({ message: 'Page break inserted', previousHtml });

            // Clear hover state
            setHoveredElement(null);
        }
    }, [effectiveHtml, setHtmlContent]);

    // Undo page break insertion
    const handleUndo = useCallback(() => {
        if (toast?.previousHtml) {
            setHtmlContent(toast.previousHtml);
            setToast(null);
        }
    }, [toast, setHtmlContent]);

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const blob = await formatStructure(
                { title: title || 'Untitled Document', subtitle, author, date, elements: [] },
                selectedStyle, 'pdf', fullPdfHtml
            );
            const safeTitle = (title || 'document').replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\s\-_]/g, '').trim() || 'document';
            downloadBlob(blob, `${safeTitle}.pdf`);
        } catch (error) {
            console.error('PDF export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const totalPages = pages.length + 1;
    const goToPage = (page: number) => {
        if (page >= 0 && page < totalPages) {
            setCurrentPage(page);
            const pageElement = document.getElementById(`preview-page-${page}`);
            pageElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const pageStyle: React.CSSProperties = {
        width: `${A4_WIDTH_MM}mm`,
        minHeight: `${A4_HEIGHT_MM}mm`,
        padding: `${A4_MARGIN_MM}mm`,
        fontFamily: styleConfig.fontFamily,
        fontSize: '11pt',
        lineHeight: String(styleConfig.lineHeight || 1.6),
        color: '#000000',
        boxSizing: 'border-box',
        backgroundColor: 'white',
        position: 'relative',
    };

    const contentStyles = getPdfContentStyles(styleConfig);

    return (
        <div className={`flex flex-col h-full transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
            style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)' }}>

            {/* Hidden measurement iframe - must have proper width to measure correctly */}
            <iframe ref={measureIframeRef} srcDoc={measurementHtml} onLoad={handleMeasureIframeLoad}
                style={{
                    position: 'absolute',
                    visibility: 'hidden',
                    width: `${A4_CONTENT_WIDTH_MM}mm`,
                    height: '10000px',
                    left: '-9999px',
                    top: '-9999px'
                }} title="Measure" />

            {/* ========== PREMIUM TOOLBAR ========== */}
            <div className="relative z-20 print:hidden">
                {/* Glassmorphism toolbar with auto-fade */}
                <div className="mx-4 mt-4 rounded-2xl overflow-hidden opacity-85 hover:opacity-100 transition-opacity duration-200"
                    style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            {/* Left section */}
                            <div className="flex items-center gap-4">
                                <button onClick={onBackToEdit}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200">
                                    <ChevronLeft size={18} />
                                    <span className="font-medium">Back to Edit</span>
                                </button>

                                <div className="h-6 w-px bg-white/20" />

                                <div className="flex items-center gap-2 text-white/60">
                                    <FileText size={16} />
                                    <span className="text-sm font-medium">
                                        {isRendering ? 'Preparing...' : `${totalPages} pages`}
                                    </span>
                                </div>
                            </div>

                            {/* Center section - Page navigation */}
                            <div className="flex items-center gap-3">
                                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0}
                                    className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                    <ChevronLeft size={18} />
                                </button>

                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10">
                                    <span className="text-white font-semibold">{currentPage + 1}</span>
                                    <span className="text-white/40">/</span>
                                    <span className="text-white/60">{totalPages}</span>
                                </div>

                                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages - 1}
                                    className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                    <ChevronRight size={18} />
                                </button>
                            </div>

                            {/* Right section */}
                            <div className="flex items-center gap-4">
                                {/* Zoom slider */}
                                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5">
                                    <button onClick={() => setZoom(Math.max(30, zoom - 10))}
                                        className="p-1 text-white/60 hover:text-white transition-colors">
                                        <ZoomOut size={16} />
                                    </button>
                                    <div className="w-24">
                                        <Slider value={[zoom]} onValueChange={(v: number[]) => setZoom(v[0])} min={30} max={150} step={5}
                                            className="cursor-pointer" />
                                    </div>
                                    <span className="text-white/60 text-sm w-10 text-center">{zoom}%</span>
                                    <button onClick={() => setZoom(Math.min(150, zoom + 10))}
                                        className="p-1 text-white/60 hover:text-white transition-colors">
                                        <ZoomIn size={16} />
                                    </button>
                                </div>

                                <div className="h-6 w-px bg-white/20" />

                                {/* Fullscreen toggle */}
                                <button onClick={() => setIsFullscreen(!isFullscreen)}
                                    className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all">
                                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                                </button>

                                {/* Export button */}
                                <button onClick={handleExportPDF} disabled={isExporting}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white transition-all duration-300 disabled:opacity-50"
                                    style={{
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
                                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
                                    }}>
                                    {isExporting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download size={18} />
                                            <span>Export PDF</span>
                                        </>
                                    )}
                                </button>

                                <button onClick={() => window.print()}
                                    className="p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
                                    title="Print">
                                    <Printer size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========== PREVIEW AREA ========== */}
            <div ref={containerRef} className="flex-1 overflow-auto py-8 print:p-0">
                {isRendering ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                            <Loader2 className="h-12 w-12 text-blue-400 animate-spin relative" />
                        </div>
                        <p className="text-white/60 mt-6 font-medium">Preparing preview...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-10" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>

                        {/* ========== COVER PAGE ========== */}
                        <div id="preview-page-0" className="relative group">
                            {/* Page number badge */}
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white/80 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
                                Cover Page
                            </div>

                            {/* Page with premium shadow - static, no hover scale */}
                            <div className="relative rounded-sm"
                                style={{
                                    ...pageStyle,
                                    height: `${A4_HEIGHT_MM}mm`,
                                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)'
                                }}>
                                {/* Decorative gradient overlay */}
                                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${styleConfig.accentColor}, ${styleConfig.headingColor})` }} />

                                <div className="h-full flex flex-col justify-center items-center text-center relative">
                                    {/* Decorative circles */}
                                    <div className="absolute top-8 right-8 w-32 h-32 rounded-full opacity-5" style={{ background: styleConfig.accentColor }} />
                                    <div className="absolute bottom-12 left-12 w-48 h-48 rounded-full opacity-5" style={{ background: styleConfig.headingColor }} />

                                    <h1 style={{ fontSize: '32pt', fontWeight: '700', color: styleConfig.headingColor, marginBottom: '16px', letterSpacing: '-0.02em' }}>
                                        {title || 'Untitled Document'}
                                    </h1>
                                    {subtitle && (
                                        <p style={{ fontSize: '14pt', color: styleConfig.accentColor, fontStyle: 'italic', marginBottom: '32px', maxWidth: '80%' }}>
                                            {subtitle}
                                        </p>
                                    )}
                                    <div style={{ width: '80px', height: '3px', background: `linear-gradient(90deg, ${styleConfig.accentColor}, ${styleConfig.headingColor})`, borderRadius: '2px', margin: '24px auto' }} />
                                    <div style={{ fontSize: '11pt', color: '#666666', marginTop: '48px' }}>
                                        {author && <p style={{ fontWeight: '500' }}>{author}</p>}
                                        {date && <p style={{ marginTop: '8px', opacity: 0.8 }}>{date}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ========== CONTENT PAGES ========== */}
                        {pages.map((page, index) => (
                            <div key={index} id={`preview-page-${index + 1}`} className="relative group">
                                {/* Page number badge */}
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white/80 opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
                                    Page {index + 2}
                                </div>

                                {/* Manual Page Break Indicator */}
                                {page.hasManualBreak && (
                                    <div className="absolute -top-8 left-0 right-0 flex items-center justify-center z-10">
                                        <button
                                            onClick={() => removePageBreak(page.breakIndex)}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                                            style={{
                                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                color: 'white',
                                                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                                            }}
                                            title="Remove this page break"
                                        >
                                            <Merge size={14} />
                                            <span>Remove Break</span>
                                        </button>
                                    </div>
                                )}

                                <div
                                    className="relative rounded-sm"
                                    style={{
                                        ...pageStyle,
                                        height: `${A4_HEIGHT_MM}mm`,
                                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)'
                                    }}
                                    onMouseMove={(e) => handlePageMouseMove(e, index)}
                                    onMouseLeave={handlePageMouseLeave}
                                >
                                    <style dangerouslySetInnerHTML={{ __html: contentStyles }} />
                                    <div className="measure-container" dangerouslySetInnerHTML={{ __html: page.content }} />

                                    {/* Page footer */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-400">
                                        {index + 2}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Bottom spacer */}
                        <div className="h-8" />
                    </div>
                )}
            </div>

            {/* ========== MINI PAGE NAVIGATOR ========== */}
            {!isRendering && totalPages > 1 && (
                <div className="fixed right-6 top-1/2 -translate-y-1/2 z-30 print:hidden opacity-70 hover:opacity-100 transition-opacity duration-200">
                    <div className="p-2 rounded-2xl" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)' }}>
                        <div className="flex flex-col gap-2">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button key={i} onClick={() => goToPage(i)}
                                    className={`w-10 h-10 rounded-lg text-xs font-semibold transition-all duration-200 ${currentPage === i
                                        ? 'bg-blue-500 text-white shadow-lg'
                                        : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                                        }`}>
                                    {i === 0 ? '📄' : i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ========== MAGIC BREAK HANDLE OVERLAY ========== */}
            {hoveredElement && !isRendering && (
                <div
                    className="fixed z-40 print:hidden"
                    style={{
                        top: hoveredElement.rect.top - 2,
                        left: hoveredElement.rect.left - 56,
                        height: hoveredElement.rect.height + 4,
                    }}
                    onMouseEnter={handleMouseEnterHandle}
                    onMouseLeave={handleMouseLeaveHandle}
                >
                    {/* Safe Bridge - invisible area connecting handle to content */}
                    <div
                        className="absolute"
                        style={{
                            top: 0,
                            left: 0,
                            width: 56,
                            height: '100%',
                            background: 'transparent',
                        }}
                    />

                    {/* Highlight border on hovered element */}
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            top: 2,
                            left: 56,
                            width: hoveredElement.rect.width,
                            height: hoveredElement.rect.height,
                            border: '2px solid rgba(59, 130, 246, 0.4)',
                            borderRadius: '4px',
                            background: 'rgba(59, 130, 246, 0.03)',
                        }}
                    />

                    {/* Break Handle Button */}
                    <button
                        className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-xl shadow-xl transition-all duration-150 hover:scale-105"
                        style={{
                            left: 4,
                            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                        }}
                        onClick={() => injectPageBreak(hoveredElement.element)}
                        title="Insert page break before this element"
                    >
                        <Scissors size={18} className="text-white" />
                    </button>
                </div>
            )}

            {/* ========== TOAST NOTIFICATION ========== */}
            {toast && (
                <Toast
                    message={toast.message}
                    onUndo={handleUndo}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}

export default PagedPreview;
