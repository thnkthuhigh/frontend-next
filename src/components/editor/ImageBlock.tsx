"use client";

/**
 * ImageBlock Component
 * Interactive image component with:
 * - Resize handles (drag to resize)
 * - Floating toolbar (align, size presets)
 * - Caption support
 * - High-DPI rendering optimization
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { cn } from "@/lib/utils";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Minimize2,
  GripVertical,
  Type,
  Loader2,
  ImageIcon,
} from "lucide-react";

interface ImageBlockProps extends NodeViewProps { }

// Size presets for quick selection
const SIZE_PRESETS = [
  { label: "S", value: "25%", title: "Small (25%)" },
  { label: "M", value: "50%", title: "Medium (50%)" },
  { label: "L", value: "75%", title: "Large (75%)" },
  { label: "Full", value: "100%", title: "Full Width" },
];

// Alignment options
const ALIGN_OPTIONS = [
  { icon: AlignLeft, value: "left", title: "Float Left" },
  { icon: AlignCenter, value: "center", title: "Center" },
  { icon: AlignRight, value: "right", title: "Float Right" },
  { icon: Maximize2, value: "full", title: "Full Width" },
];

export function ImageBlock({ node, updateAttributes, selected, editor }: ImageBlockProps): React.JSX.Element {
  const {
    src,
    alt,
    width,
    align,
    naturalWidth,
    naturalHeight,
    caption,
    loading,
  } = node.attrs;

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const isMountedRef = useRef(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showCaption, setShowCaption] = useState(!!caption);
  const [captionText, setCaptionText] = useState(caption || "");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Sync caption state with node attrs
  useEffect(() => {
    setCaptionText(caption || "");
    setShowCaption(!!caption);
  }, [caption]);

  // Calculate display width for High-DPI (Retina) screens
  const getOptimalDisplayWidth = useCallback(() => {
    if (!naturalWidth) return width;

    // For Retina displays (2x pixel density), use half the natural width
    // This ensures 1:1 pixel mapping for maximum sharpness
    const devicePixelRatio = typeof window !== "undefined" ? window.devicePixelRatio : 1;
    const editorWidth = containerRef.current?.parentElement?.clientWidth || 600;

    if (devicePixelRatio >= 2) {
      // Retina: Display at half natural size for sharpness
      const optimalWidth = Math.min(naturalWidth / 2, editorWidth - 40);
      return `${Math.round(optimalWidth)}px`;
    }

    // Standard display: Use natural width up to editor width
    return `${Math.min(naturalWidth, editorWidth - 40)}px`;
  }, [naturalWidth, width]);

  // Handle image load - get natural dimensions
  const handleImageLoad = useCallback(() => {
    queueMicrotask(() => {
      if (!isMountedRef.current) return;
      setImageLoaded(true);
      setImageError(false);
    });

    if (imageRef.current && (!naturalWidth || !naturalHeight)) {
      const { naturalWidth: nw, naturalHeight: nh } = imageRef.current;

      // Defer updates to avoid flushSync error in React 19
      queueMicrotask(() => {
        if (!isMountedRef.current) return;
        
        // Store natural dimensions for High-DPI calculations
        updateAttributes({
          naturalWidth: nw,
          naturalHeight: nh,
        });

        // Auto-set optimal display width for Retina
        if (!width || width === "100%") {
          const devicePixelRatio = typeof window !== "undefined" ? window.devicePixelRatio : 1;
          const editorWidth = containerRef.current?.parentElement?.clientWidth || 600;

          if (devicePixelRatio >= 2 && nw > editorWidth) {
            // Retina optimization: default to half natural width
            const optimalWidth = Math.min(nw / 2, editorWidth - 40);
            updateAttributes({ width: `${Math.round(optimalWidth)}px` });
          }
        }
      });
    }
  }, [naturalWidth, naturalHeight, width, updateAttributes]);

  // Handle resize drag - fixed for all alignments
  const handleResizeStart = useCallback((e: React.MouseEvent, direction: "left" | "right") => {
    e.preventDefault();
    e.stopPropagation();
    queueMicrotask(() => setIsResizing(true));

    const startX = e.clientX;
    // Get actual rendered width from the figure element (containerRef), not image
    // For float left/right, we need the figure's width, not the wrapper
    const startWidth = containerRef.current?.offsetWidth || 300;
    const currentAlign = align || "center";

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;

      // All alignments use same logic: double delta for intuitive resize
      // Right handle: drag right = grow, drag left = shrink
      // Left handle: drag left = grow, drag right = shrink
      const effectiveDelta = direction === "right" ? deltaX : -deltaX;
      const newWidth = Math.max(100, startWidth + effectiveDelta * 2);

      // Max width constraints
      const maxWidth = containerRef.current?.parentElement?.clientWidth || 800;
      const maxAllowed = maxWidth - 40;
      const clampedWidth = Math.min(newWidth, maxAllowed);

      // Defer update to avoid flushSync error
      queueMicrotask(() => {
        updateAttributes({ width: `${Math.round(clampedWidth)}px` });
      });
    };

    const handleMouseUp = () => {
      queueMicrotask(() => setIsResizing(false));
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [updateAttributes, align]);

  // Handle caption change
  const handleCaptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    queueMicrotask(() => {
      setCaptionText(value);
      updateAttributes({ caption: value });
    });
  }, [updateAttributes]);

  // Calculate container styles based on alignment
  const getContainerStyles = () => {
    switch (align) {
      case "left":
        return "clear-both";
      case "right":
        return "clear-both";
      case "full":
        return "w-full clear-both";
      case "center":
      default:
        return "mx-auto clear-both";
    }
  };

  const getWrapperStyles = () => {
    switch (align) {
      case "left":
        return "flex justify-start my-6";  // Flexbox align left, same behavior as center
      case "right":
        return "flex justify-end my-6";    // Flexbox align right, same behavior as center
      case "full":
        return "w-full my-6";
      case "center":
      default:
        return "flex justify-center my-6";
    }
  };

  // Loading state
  if (loading) {
    return (
      <NodeViewWrapper className="image-node-view">
        <div className={cn("relative", getWrapperStyles())}>
          <div
            ref={containerRef}
            className={cn(
              "relative flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-8",
              getContainerStyles()
            )}
            style={{ width: width || "100%", aspectRatio: "16/9" }}
          >
            <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mb-2" />
            <span className="text-sm text-zinc-500">Uploading image...</span>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  // Error state
  if (imageError) {
    return (
      <NodeViewWrapper className="image-node-view">
        <div className={cn("relative", getWrapperStyles())}>
          <div
            ref={containerRef}
            className={cn(
              "relative flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-8 border-2 border-dashed border-zinc-300 dark:border-zinc-600",
              getContainerStyles()
            )}
            style={{ width: width || "100%", aspectRatio: "16/9" }}
          >
            <ImageIcon className="w-8 h-8 text-zinc-400 mb-2" />
            <span className="text-sm text-zinc-500">Failed to load image</span>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="image-node-view">
      {/* Wrapper div to isolate image from text flow */}
      <div className={cn("relative", getWrapperStyles())} data-drag-handle>
        <figure
          ref={containerRef}
          className={cn(
            "relative group transition-all duration-200",
            getContainerStyles(),
            selected && "ring-2 ring-blue-500 ring-offset-2 rounded-lg",
            isResizing && "select-none"
          )}
          style={{
            // Use pixels for consistency
            width: align === "full" ? "100%" : (width || "auto"),
            maxWidth: "100%"
          }}
        >
          {/* Image */}
          <div className="relative">
            <img
              ref={imageRef}
              src={src}
              alt={alt || ""}
              onLoad={handleImageLoad}
              onError={() => queueMicrotask(() => setImageError(true))}
              className={cn(
                "block rounded-lg transition-opacity duration-200",
                !imageLoaded && "opacity-0",
                imageLoaded && "opacity-100"
              )}
              style={{
                width: "100%",
                height: "auto",
                // High-DPI rendering optimization
                imageRendering: naturalWidth && naturalWidth > 1000 ? "auto" : "auto",
              }}
              draggable={false}
            />

            {/* Loading skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
            )}

            {/* Resize handles - only show when selected */}
            {selected && imageLoaded && (
              <>
                {/* Left handle */}
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-12 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-full shadow-lg cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-blue-50 dark:hover:bg-blue-900 transition-all z-10"
                  onMouseDown={(e) => handleResizeStart(e, "left")}
                >
                  <GripVertical size={10} className="text-zinc-400" />
                </div>

                {/* Right handle */}
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-12 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-full shadow-lg cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-blue-50 dark:hover:bg-blue-900 transition-all z-10"
                  onMouseDown={(e) => handleResizeStart(e, "right")}
                >
                  <GripVertical size={10} className="text-zinc-400" />
                </div>
              </>
            )}
          </div>

          {/* Floating Toolbar - show when selected */}
          {selected && imageLoaded && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Alignment buttons */}
              {ALIGN_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    queueMicrotask(() => updateAttributes({ align: option.value }));
                  }}
                  title={option.title}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    align === option.value
                      ? "bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                  )}
                >
                  <option.icon size={14} />
                </button>
              ))}

              {/* Divider */}
              <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />

              {/* Size presets */}
              {SIZE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    // Get the editor/parent container width
                    const editorEl = containerRef.current?.closest('.ProseMirror') as HTMLElement;
                    const parentWidth = editorEl?.clientWidth || containerRef.current?.parentElement?.clientWidth || 600;
                    const percentage = parseInt(preset.value) / 100;
                    const targetWidth = Math.round((parentWidth - 40) * percentage);
                    
                    queueMicrotask(() => {
                      updateAttributes({ width: `${targetWidth}px` });
                    });
                  }}
                  title={preset.title}
                  className={cn(
                    "px-2 py-1 text-xs font-medium rounded transition-colors",
                    // Compare by percentage range for highlighting
                    (() => {
                      const currentPx = parseInt(width || "0");
                      const containerWidth = containerRef.current?.parentElement?.clientWidth || 600;
                      const presetPx = Math.round(containerWidth * parseInt(preset.value) / 100);
                      const tolerance = 20; // 20px tolerance
                      return Math.abs(currentPx - presetPx) < tolerance;
                    })()
                      ? "bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                  )}
                >
                  {preset.label}
                </button>
              ))}

              {/* Divider */}
              <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />

              {/* Caption toggle */}
              <button
                onClick={() => queueMicrotask(() => setShowCaption(!showCaption))}
                title="Toggle Caption"
                className={cn(
                  "p-1.5 rounded transition-colors",
                  showCaption
                    ? "bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                )}
              >
                <Type size={14} />
              </button>
            </div>
          )}

          {/* Caption */}
          {(showCaption || caption) && (
            <figcaption className="mt-2">
              <input
                type="text"
                value={captionText}
                onChange={handleCaptionChange}
                placeholder="Add a caption..."
                className="w-full text-center text-sm text-zinc-500 dark:text-zinc-400 bg-transparent border-none outline-none focus:text-zinc-700 dark:focus:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
            </figcaption>
          )}

          {/* Dimension info - show on hover when selected */}
          {selected && imageLoaded && naturalWidth > 0 && (
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-white text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
              {naturalWidth} × {naturalHeight}px
            </div>
          )}
        </figure>
      </div>
    </NodeViewWrapper>
  );
}

export default ImageBlock;
