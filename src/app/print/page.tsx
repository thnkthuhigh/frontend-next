"use client";

import { useEffect, useState, useRef } from "react";
import { useDocumentStore } from "@/store/document-store";
import { DocumentPrintLayout } from "@/components/print/DocumentPrintLayout";
import { getStyleConfig } from "@/lib/document-styles";

// A4 dimensions in mm
const MARGIN = 25;

export default function PrintPage() {
  const {
    title, subtitle, author, date, htmlContent, selectedStyle, editorMode,
    setTitle, setSubtitle, setAuthor, setDate, setBlocks, setSelectedStyle, setHtmlContent
  } = useDocumentStore();
  const [isReady, setIsReady] = useState(false);
  const [isPagedJsReady, setIsPagedJsReady] = useState(false);
  const [renderMode, setRenderMode] = useState<'loading' | 'pagedjs' | 'css'>('loading');
  const contentRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for data injected by Playwright
    const checkForData = () => {
      // @ts-ignore
      const data = window.__PRINT_DATA__;
      if (data) {
        console.log("Received print data:", data);
        if (data.title) setTitle(data.title);
        if (data.subtitle) setSubtitle(data.subtitle);
        if (data.author) setAuthor(data.author);
        if (data.date) setDate(data.date);
        if (data.blocks) setBlocks(data.blocks);
        if (data.htmlContent) setHtmlContent(data.htmlContent);
        if (data.style) setSelectedStyle(data.style);
        setIsReady(true);
      }
    };

    // Check immediately
    checkForData();

    // Also listen for event (backup)
    window.addEventListener("print-data-ready", checkForData);
    return () => window.removeEventListener("print-data-ready", checkForData);
  }, []);

  // Initialize Paged.js for proper pagination
  useEffect(() => {
    if (isReady && typeof window !== 'undefined' && sourceRef.current) {
      const initPagination = async () => {
        try {
          // Wait a tick for React to render the source layout
          await new Promise(resolve => setTimeout(resolve, 100));

          // Dynamically import Paged.js
          const { Previewer } = await import('pagedjs');
          const previewer = new Previewer();

          // Get source HTML from the Shared Component!
          const sourceHTML = sourceRef.current!.innerHTML;

          // Hide source content
          sourceRef.current!.style.display = 'none';

          console.log("Starting Paged.js pagination...");
          const flow = await previewer.preview(
            sourceHTML,
            [], // stylesheets
            contentRef.current! // render target
          );

          console.log("✅ Paged.js rendered", flow.total, "pages");

          // Signal to Playwright that pagination is complete
          (window as any).isPagedJsReady = true;
          setIsPagedJsReady(true);
          setRenderMode('pagedjs');

          // Dispatch event for additional listeners
          window.dispatchEvent(new Event('pagedjs-ready'));
        } catch (err) {
          console.log("⚠️ Paged.js not available, using CSS pagination:", err);
          // Fall back to CSS-based pagination
          setRenderMode('css');
          (window as any).isPagedJsReady = true;
          setIsPagedJsReady(true);
        }
      };

      initPagination();
    }
  }, [isReady]);



  const styleConfig = getStyleConfig(selectedStyle);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading print data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <style jsx global>{`
        body { 
          margin: 0; 
          padding: 0; 
          background: white; 
        }
        
        /* Paged.js page setup */
        @page { 
          size: A4; 
          margin: ${MARGIN}mm;
        }
        
        /* Pagedjs container */
        .pagedjs_pages {
          width: 210mm;
          margin: 0 auto;
        }
        .pagedjs_page {
          background: white;
          margin-bottom: 10mm;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        @media print {
          .pagedjs_page {
            box-shadow: none;
            margin-bottom: 0;
          }
        }
      `}</style>

      {/* 
         Render the shared layout into a hidden "source" div.
         Paged.js will read this HTML and paginate it into contentRef.
      */}
      <div className="print-source-container">
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

      {/* Paged.js render target */}
      <div ref={contentRef} className="pagedjs-container print-page" />

      {/* Fallback CSS pagination view - reusing duplicate layout logic? 
          Actually, if Paged.js fails, we can just show the sourceRef content naturally.
          But for now let's keep it simple. If Paged.js fails, sourceRef is hidden.
          We can toggle it back visible.
      */}
      {renderMode === 'css' && (
        <div style={{ padding: '25mm' }}>
          <p className="text-red-500 mb-4 print:hidden">⚠️ Formatting Engine Failed - Using basic view</p>
          <div dangerouslySetInnerHTML={{ __html: sourceRef.current?.innerHTML || '' }} />
        </div>
      )}
    </div>
  );
}
