import React from "react";
import { sanitizeHtml } from "@/lib/sanitize";

// P2-013: Customizable header/footer options
interface HeaderFooterConfig {
    showHeader?: boolean;
    showFooter?: boolean;
    headerLeft?: string;
    headerCenter?: string;
    headerRight?: string;
    footerLeft?: string;
    footerCenter?: string;
    footerRight?: string;
    showPageNumbers?: boolean;
}

interface DocumentPrintLayoutProps {
    title: string;
    subtitle: string;
    author: string;
    date: string;
    htmlContent: string;
    styleConfig: {
        fontFamily: string;
        headingColor: string;
        accentColor: string;
    };
    // P2-013: Header/Footer customization
    headerFooterConfig?: HeaderFooterConfig;
}

export const DocumentPrintLayout = React.forwardRef<HTMLDivElement, DocumentPrintLayoutProps>(
    ({ title, subtitle, author, date, htmlContent, styleConfig, headerFooterConfig }, ref) => {
        // P2-013: Default header/footer config
        const hfConfig: HeaderFooterConfig = {
            showHeader: true,
            showFooter: true,
            headerLeft: '',
            headerCenter: title || 'Document',
            headerRight: '',
            footerLeft: author || '',
            footerCenter: '',
            footerRight: 'Page {pageNumber}',
            showPageNumbers: true,
            ...headerFooterConfig
        };

        return (
            <div ref={ref} className="print-source">
                {/* P2-013: Print Header/Footer CSS */}
                <style>{`
                    @page {
                        @top-left { content: "${hfConfig.headerLeft}"; }
                        @top-center { content: "${hfConfig.headerCenter}"; }
                        @top-right { content: "${hfConfig.headerRight}"; }
                        @bottom-left { content: "${hfConfig.footerLeft}"; }
                        @bottom-center { content: "${hfConfig.showPageNumbers ? 'counter(page)' : hfConfig.footerCenter}"; }
                        @bottom-right { content: "${hfConfig.footerRight?.replace('{pageNumber}', '" counter(page) "')}"; }
                    }
                    
                    /* Running header/footer for Paged.js */
                    .pagedjs_pagebox {
                        --pagedjs-string-title: "${hfConfig.headerCenter}";
                    }
                    
                    .pagedjs_margin-top-center::after {
                        content: var(--pagedjs-string-title);
                        font-size: 9pt;
                        color: #666;
                    }
                    
                    .pagedjs_margin-bottom-center::after {
                        content: counter(page);
                        font-size: 9pt;
                        color: #666;
                    }
                    
                    .pagedjs_margin-bottom-left::after {
                        content: "${hfConfig.footerLeft}";
                        font-size: 9pt;
                        color: #666;
                    }
                `}</style>
                {/* Cover Page */}
                <div
                    className="cover-page"
                    style={{
                        pageBreakAfter: 'always',
                        minHeight: 'calc(297mm - 50mm)', // A4 height minus margins
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        fontFamily: styleConfig.fontFamily
                    }}
                >
                    <h1 style={{
                        fontSize: '28pt',
                        fontWeight: 'bold',
                        color: styleConfig.headingColor,
                        marginBottom: '16pt'
                    }}>
                        {title || "Untitled Document"}
                    </h1>
                    {subtitle && (
                        <h2 style={{
                            fontSize: '18pt',
                            fontStyle: 'italic',
                            color: styleConfig.accentColor,
                            marginBottom: '24pt'
                        }}>
                            {subtitle}
                        </h2>
                    )}
                    <div style={{
                        width: '60px',
                        height: '2pt',
                        backgroundColor: styleConfig.accentColor,
                        margin: '24pt 0'
                    }} />
                    <div style={{
                        fontSize: '11pt',
                        color: '#666',
                        marginTop: 'auto',
                        paddingBottom: '48pt'
                    }}>
                        {author && <p style={{ margin: '4pt 0' }}>{author}</p>}
                        {date && <p style={{ marginTop: '8pt' }}>{date}</p>}
                    </div>
                </div>

                {/* Main Content */}
                <div
                    className="document-content"
                    style={{
                        fontFamily: styleConfig.fontFamily,
                        // CSS Variables for internal content styling if needed
                        '--heading-color': styleConfig.headingColor,
                        '--accent-color': styleConfig.accentColor,
                    } as React.CSSProperties}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlContent) }}
                />
            </div>
        );
    }
);

DocumentPrintLayout.displayName = "DocumentPrintLayout";
