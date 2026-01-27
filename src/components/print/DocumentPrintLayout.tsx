import React from "react";
import { sanitizeHtml } from "@/lib/sanitize";

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
}

export const DocumentPrintLayout = React.forwardRef<HTMLDivElement, DocumentPrintLayoutProps>(
    ({ title, subtitle, author, date, htmlContent, styleConfig }, ref) => {
        return (
            <div ref={ref} className="print-source">
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
