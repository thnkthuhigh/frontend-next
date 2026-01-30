"use client";

import { useState } from "react";
import { useVersionHistory } from "@/hooks/use-version-history";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, RotateCcw, Save, Trash2, AlertCircle, Loader2 } from "lucide-react";
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
      {/* Header with Save Version Button */}
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Version History</h3>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSaveForm(!showSaveForm)}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-1.5" />
            Save Version
          </Button>
        </div>

        {/* Save Version Form */}
        {showSaveForm && (
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
            <Input
              placeholder="Version description (optional)"
              value={versionDescription}
              onChange={(e) => setVersionDescription(e.target.value)}
              disabled={isSaving}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveVersion} disabled={isSaving} className="flex-1">
                {isSaving ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Snapshot"
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
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

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

              return (
                <div
                  key={version.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    isLatest
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
                  </div>

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
      {versions.length > 0 && (
        <div className="p-3 border-t border-border shrink-0 bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            {versions.length} version{versions.length > 1 ? "s" : ""} saved
          </p>
        </div>
      )}
    </div>
  );
}
