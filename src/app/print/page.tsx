"use client";

import { useEffect, useState, useRef } from "react";
import { DocumentPreview } from "@/components/preview/document-preview";
import { useDocumentStore } from "@/store/document-store";

// A4 dimensions in mm
const A4_WIDTH = 210;
const A4_HEIGHT = 297;
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
          // Dynamically import Paged.js
          const { Previewer } = await import('pagedjs');
          const previewer = new Previewer();
          
          // Get source HTML
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
      
      // Wait for DOM to settle
      setTimeout(initPagination, 500);
    }
  }, [isReady]);

  // Get style config
  const getStyleConfig = () => {
    const configs: Record<string, { fontFamily: string; headingColor: string; accentColor: string }> = {
      professional: {
        fontFamily: "'Times New Roman', serif",
        headingColor: "#0f172a",
        accentColor: "#1e3a8a",
      },
      academic: {
        fontFamily: "'Times New Roman', serif",
        headingColor: "#000000",
        accentColor: "#000000",
      },
      modern: {
        fontFamily: "Arial, sans-serif",
        headingColor: "#2563eb",
        accentColor: "#0ea5e9",
      },
      minimal: {
        fontFamily: "Calibri, sans-serif",
        headingColor: "#171717",
        accentColor: "#737373",
      },
    };
    return configs[selectedStyle] || configs.professional;
  };

  const styleConfig = getStyleConfig();

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
  
  // Show pagination status
  if (editorMode === "wysiwyg" && htmlContent && !isPagedJsReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Rendering pages with Paged.js...</p>
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
        
        /* Cover page - full height centered content */
        .cover-page {
          page-break-after: always;
          break-after: page;
          min-height: calc(${A4_HEIGHT - 2 * MARGIN}mm);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }
        
        /* Content styling */
        .print-content h1 { 
          font-size: 18pt; 
          font-weight: bold;
          margin-top: 18pt;
          margin-bottom: 10pt;
          color: ${styleConfig.headingColor};
          border-bottom: 1px solid ${styleConfig.accentColor};
          padding-bottom: 4pt;
        }
        .print-content h2 { 
          font-size: 14pt; 
          font-weight: bold;
          margin-top: 14pt;
          margin-bottom: 8pt;
          color: ${styleConfig.accentColor};
        }
        .print-content h3 { 
          font-size: 12pt; 
          font-weight: bold;
          margin-top: 12pt;
          margin-bottom: 6pt;
          color: #333;
        }
        .print-content p { 
          font-size: 11pt; 
          line-height: 1.6;
          margin-bottom: 8pt;
          text-align: justify;
          color: #333;
        }
        .print-content ul, .print-content ol { 
          margin-left: 20pt;
          margin-bottom: 8pt;
        }
        .print-content li { 
          margin-bottom: 4pt;
          color: #333;
        }
        .print-content blockquote {
          border-left: 3pt solid ${styleConfig.accentColor};
          padding-left: 12pt;
          margin: 10pt 0;
          font-style: italic;
          color: #555;
        }
        .print-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 10pt 0;
        }
        .print-content th, .print-content td {
          border: 1px solid #ccc;
          padding: 6pt;
        }
        .print-content th {
          background: ${styleConfig.accentColor};
          color: white;
        }
        .print-content pre {
          background: #f5f5f5;
          padding: 10pt;
          font-family: monospace;
          font-size: 9pt;
          overflow-x: auto;
        }
        
        /* Pagedjs container */
        .pagedjs_pages {
          width: ${A4_WIDTH}mm;
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
      
      {/* Render based on editor mode */}
      {editorMode === "wysiwyg" && htmlContent ? (
        <>
          {/* Source content for Paged.js (hidden after processing) */}
          <div ref={sourceRef} className="print-source print-page">
            {/* Cover Page */}
            <div className="cover-page">
              <h1 style={{ 
                fontSize: '24pt', 
                fontWeight: 'bold',
                color: styleConfig.headingColor,
                marginBottom: '16pt'
              }}>
                {title || "Untitled Document"}
              </h1>
              {subtitle && (
                <h2 style={{ 
                  fontSize: '14pt', 
                  fontStyle: 'italic',
                  color: styleConfig.accentColor,
                  marginBottom: '24pt'
                }}>
                  {subtitle}
                </h2>
              )}
              <div style={{ 
                width: '60pt', 
                height: '2pt', 
                background: styleConfig.accentColor,
                margin: '16pt 0'
              }} />
              <div style={{ fontSize: '11pt', color: '#666', marginTop: '24pt' }}>
                {author && <p style={{ margin: '4pt 0' }}>{author}</p>}
                {date && <p style={{ margin: '4pt 0' }}>{date}</p>}
              </div>
            </div>
            
            {/* Main Content */}
            <div 
              className="print-content"
              style={{ fontFamily: styleConfig.fontFamily }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
          
          {/* Paged.js render target */}
          <div ref={contentRef} className="pagedjs-container print-page" />
          
          {/* Fallback CSS pagination view */}
          {renderMode === 'css' && (
            <div 
              className="css-pagination-fallback print-page"
              style={{
                width: `${A4_WIDTH}mm`,
                margin: '0 auto',
                padding: `${MARGIN}mm`,
                fontFamily: styleConfig.fontFamily,
                background: 'white',
              }}
            >
              {/* Cover */}
              <div className="cover-page">
                <h1 style={{ fontSize: '24pt', color: styleConfig.headingColor }}>
                  {title || "Untitled Document"}
                </h1>
                {subtitle && (
                  <h2 style={{ fontSize: '14pt', color: styleConfig.accentColor, fontStyle: 'italic' }}>
                    {subtitle}
                  </h2>
                )}
                <div style={{ marginTop: '24pt', fontSize: '11pt', color: '#666' }}>
                  {author && <p>{author}</p>}
                  {date && <p>{date}</p>}
                </div>
              </div>
              
              {/* Content */}
              <div 
                className="print-content"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
          )}
        </>
      ) : (
        /* Legacy Block-based preview */
        <DocumentPreview scale={1} />
      )}
    </div>
  );
}
