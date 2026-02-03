"use client";

import { useState, useMemo } from "react";
import { useVersionHistory } from "@/hooks/use-version-history";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, RotateCcw, Save, Trash2, AlertCircle, Loader2, Eye, EyeOff, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { formatDistanceToNow } from "@/lib/date-utils";

interface VersionHistoryPanelProps {
  documentId: string | null;
  currentContent: any;
  currentTitle: string;
  onVersionRestored?: () => void;
}

/**
 * Panel hiển thị version history với các tính năng:
 * - List all versions (descending order)
 * - Manual "Save Version" button
 * - Restore version functionality
 * - Delete old versions
 */
export function VersionHistoryPanel({
  documentId,
  currentContent,
  currentTitle,
  onVersionRestored,
}: VersionHistoryPanelProps) {
  const { versions, isLoading, error, createVersion, restoreVersion, deleteVersion } =
    useVersionHistory(documentId);

  const [isSaving, setIsSaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [versionDescription, setVersionDescription] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);
  // P1-009: Diff preview state
  const [previewVersionId, setPreviewVersionId] = useState<string | null>(null);

  // P1-009: Calculate diff stats between current content and a version
  const getDiffStats = useMemo(() => {
    return (versionContent: any) => {
      try {
        // Extract text content for comparison
        const getTextLength = (content: any): number => {
          if (!content) return 0;
          if (typeof content === 'string') return content.length;
          if (content.content) {
            // TipTap JSON format
            return JSON.stringify(content).length;
          }
          return JSON.stringify(content).length;
        };

        const getWordCount = (content: any): number => {
          if (!content) return 0;
          const text = typeof content === 'string'
            ? content
            : JSON.stringify(content);
          const words = text.match(/\b\w+\b/g);
          return words ? words.length : 0;
        };

        const currentLength = getTextLength(currentContent);
        const versionLength = getTextLength(versionContent);
        const currentWords = getWordCount(currentContent);
        const versionWords = getWordCount(versionContent);

        const charDiff = currentLength - versionLength;
        const wordDiff = currentWords - versionWords;

        return {
          charDiff,
          wordDiff,
          currentWords,
          versionWords,
          percentChange: versionLength > 0
            ? Math.round(((currentLength - versionLength) / versionLength) * 100)
            : 0
        };
      } catch {
        return { charDiff: 0, wordDiff: 0, currentWords: 0, versionWords: 0, percentChange: 0 };
      }
    };
  }, [currentContent]);

  // Handle manual save version
  const handleSaveVersion = async () => {
    if (!documentId || !currentContent) {
      return;
    }

    setIsSaving(true);
    try {
      const newVersion = await createVersion({
        documentId,
        content: currentContent,
        title: currentTitle,
        description: versionDescription.trim() || undefined,
      });

      if (newVersion) {
        setVersionDescription("");
        setShowSaveForm(false);
      }
    } catch (err) {
      console.error("Failed to save version:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle restore version
  const handleRestoreVersion = async (versionId: string) => {
    if (!documentId) return;

    const confirmed = confirm(
      "Bạn có chắc muốn restore version này? Content hiện tại sẽ được thay thế."
    );

    if (!confirmed) return;

    setIsRestoring(versionId);
    try {
      const success = await restoreVersion(versionId);

      if (success) {
        // Trigger callback để reload document
        onVersionRestored?.();

        // Refresh page để load restored content
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to restore version:", err);
    } finally {
      setIsRestoring(null);
    }
  };

  // Handle delete version
  const handleDeleteVersion = async (versionId: string) => {
    const confirmed = confirm("Bạn có chắc muốn xóa version này?");

    if (!confirmed) return;

    await deleteVersion(versionId);
  };

  if (!documentId) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No document selected</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Save Version Button - Compact for narrow sidebar */}
      <div className="px-3 py-3 border-b border-zinc-200/50 dark:border-zinc-800/50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-medium text-zinc-600 dark:text-zinc-400">History</h3>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowSaveForm(!showSaveForm)}
            disabled={isSaving}
            className="h-7 px-2 text-xs"
            title="Save Version"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            Save
          </Button>
        </div>
      </div>

      {/* Save Version Form */}
      {showSaveForm && (
        <div className="space-y-2 p-3 mx-3 mb-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
          <Input
            placeholder="Description (optional)"
            value={versionDescription}
            onChange={(e) => setVersionDescription(e.target.value)}
            disabled={isSaving}
            className="text-xs h-8"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveVersion} disabled={isSaving} className="flex-1 h-7 text-xs">
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowSaveForm(false);
                setVersionDescription("");
              }}
              disabled={isSaving}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Versions List */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4 m-4 bg-destructive/10 text-destructive rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Error loading versions</p>
              <p className="text-xs opacity-90 mt-1">{error}</p>
            </div>
          </div>
        )}

        {isLoading && !versions.length ? (
          <div className="p-8 text-center text-muted-foreground">
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin opacity-50" />
            <p className="text-sm">Loading versions...</p>
          </div>
        ) : versions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-1">No versions saved yet</p>
            <p className="text-xs opacity-70">Click "Save Version" to create a snapshot</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {versions.map((version, index) => {
              const isLatest = index === 0;
              const timestamp = new Date(version.created_at);
              const isPreviewOpen = previewVersionId === version.id;
              const diffStats = !isLatest ? getDiffStats(version.content) : null;

              return (
                <div
                  key={version.id}
                  className={`p-3 rounded-lg border transition-colors ${isLatest
                    ? "bg-primary/5 border-primary/20"
                    : "bg-card border-border hover:bg-muted/50"
                    }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">
                          Version {version.version_number}
                        </span>
                        {isLatest && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded">
                            Latest
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(timestamp)}
                      </p>
                    </div>
                    {/* P1-009: Diff preview toggle button */}
                    {!isLatest && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPreviewVersionId(isPreviewOpen ? null : version.id)}
                        className="h-6 px-1.5"
                        title={isPreviewOpen ? "Hide diff" : "Show diff from current"}
                      >
                        {isPreviewOpen ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    )}
                  </div>

                  {/* P1-009: Diff stats display */}
                  {!isLatest && diffStats && (
                    <div className="flex items-center gap-3 mb-2 text-xs">
                      <div className="flex items-center gap-1">
                        {diffStats.wordDiff > 0 ? (
                          <ArrowUpRight className="w-3 h-3 text-green-500" />
                        ) : diffStats.wordDiff < 0 ? (
                          <ArrowDownRight className="w-3 h-3 text-red-500" />
                        ) : (
                          <Minus className="w-3 h-3 text-muted-foreground" />
                        )}
                        <span className={
                          diffStats.wordDiff > 0 ? "text-green-600 dark:text-green-400" :
                            diffStats.wordDiff < 0 ? "text-red-600 dark:text-red-400" :
                              "text-muted-foreground"
                        }>
                          {diffStats.wordDiff > 0 ? "+" : ""}{diffStats.wordDiff} words
                        </span>
                      </div>
                      {diffStats.percentChange !== 0 && (
                        <span className="text-muted-foreground">
                          ({diffStats.percentChange > 0 ? "+" : ""}{diffStats.percentChange}%)
                        </span>
                      )}
                    </div>
                  )}

                  {/* P1-009: Expanded diff preview */}
                  {isPreviewOpen && diffStats && (
                    <div className="mb-2 p-2 bg-muted/50 rounded text-xs space-y-1 border border-border/50">
                      <div className="text-muted-foreground font-medium mb-1.5">Changes from this version:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">This version:</span>
                          <span>{diffStats.versionWords} words</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current:</span>
                          <span>{diffStats.currentWords} words</span>
                        </div>
                      </div>
                      <div className="pt-1 border-t border-border/50 mt-1.5">
                        <span className="text-muted-foreground">Difference: </span>
                        <span className={
                          diffStats.wordDiff > 0 ? "text-green-600 dark:text-green-400 font-medium" :
                            diffStats.wordDiff < 0 ? "text-red-600 dark:text-red-400 font-medium" :
                              "text-muted-foreground"
                        }>
                          {diffStats.wordDiff > 0 ? "+" : ""}{diffStats.wordDiff} words
                          ({diffStats.percentChange > 0 ? "+" : ""}{diffStats.percentChange}%)
                        </span>
                      </div>
                    </div>
                  )}

                  {version.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {version.description}
                    </p>
                  )}

                  {version.title && (
                    <p className="text-xs text-muted-foreground/70 mb-2 truncate">
                      📄 {version.title}
                    </p>
                  )}

                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestoreVersion(version.id)}
                      disabled={isRestoring === version.id || isLatest}
                      className="flex-1 text-xs h-7"
                    >
                      {isRestoring === version.id ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Restoring...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3 h-3 mr-1" />
                          {isLatest ? "Current" : "Restore"}
                        </>
                      )}
                    </Button>
                    {!isLatest && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteVersion(version.id)}
                        disabled={isRestoring !== null}
                        className="text-xs h-7 px-2"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {
        versions.length > 0 && (
          <div className="p-3 border-t border-border shrink-0 bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              {versions.length} version{versions.length > 1 ? "s" : ""} saved
            </p>
          </div>
        )
      }
    </div >
  );
}
