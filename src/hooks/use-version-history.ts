import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type DocumentVersion = Database["public"]["Tables"]["document_versions"]["Row"];
type DocumentVersionInsert = Database["public"]["Tables"]["document_versions"]["Insert"];

interface CreateVersionParams {
  documentId: string;
  content: any;
  title?: string;
  description?: string;
}

interface VersionHistoryHook {
  versions: DocumentVersion[];
  isLoading: boolean;
  error: string | null;
  createVersion: (params: CreateVersionParams) => Promise<DocumentVersion | null>;
  restoreVersion: (versionId: string) => Promise<boolean>;
  deleteVersion: (versionId: string) => Promise<boolean>;
  refreshVersions: () => Promise<void>;
}

/**
 * Hook để quản lý version history của document
 * 
 * Features:
 * - List all versions (descending order by version_number)
 * - Create manual snapshot
 * - Restore previous version
 * - Delete old versions
 */
export function useVersionHistory(documentId: string | null): VersionHistoryHook {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all versions cho document
  const refreshVersions = useCallback(async () => {
    if (!documentId) {
      setVersions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("document_versions")
        .select("*")
        .eq("document_id", documentId)
        .order("version_number", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setVersions(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch versions";
      setError(message);
      console.error("Error fetching versions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  // Auto-refresh khi documentId thay đổi
  useEffect(() => {
    refreshVersions();
  }, [refreshVersions]);

  // Create new version snapshot
  const createVersion = useCallback(
    async (params: CreateVersionParams): Promise<DocumentVersion | null> => {
      const { documentId, content, title, description } = params;

      if (!documentId) {
        setError("Document ID is required");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        // Get next version number từ database function
        const { data: versionData, error: versionError } = await supabase.rpc(
          "get_next_version_number" as any,
          { doc_id: documentId } as any
        );

        if (versionError) {
          throw versionError;
        }

        const nextVersion = versionData as number;

        // Insert new version
        const versionInsert: DocumentVersionInsert = {
          document_id: documentId,
          version_number: nextVersion,
          content: content as any,
          title: title || null,
          description: description || null,
          created_by: user.id,
        };

        const { data: newVersion, error: insertError } = await supabase
          .from("document_versions")
          .insert(versionInsert as any)
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        // Refresh danh sách versions
        await refreshVersions();

        return newVersion;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create version";
        setError(message);
        console.error("Error creating version:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshVersions]
  );

  // Restore version về document hiện tại
  const restoreVersion = useCallback(
    async (versionId: string): Promise<boolean> => {
      if (!documentId) {
        setError("Document ID is required");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        // Get version content
        const { data: version, error: fetchError } = await supabase
          .from("document_versions")
          .select("*")
          .eq("id", versionId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (!version) {
          throw new Error("Version not found");
        }

        // Cast version to proper type for access
        const versionData = version as DocumentVersion;

        // Update document với version content
        const { error: updateError } = await (supabase
          .from("documents") as any)
          .update({
            content: versionData.content,
            title: versionData.title || "Untitled Document",
            updated_at: new Date().toISOString(),
          })
          .eq("id", documentId);

        if (updateError) {
          throw updateError;
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to restore version";
        setError(message);
        console.error("Error restoring version:", err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [documentId]
  );

  // Delete version (optional cleanup)
  const deleteVersion = useCallback(async (versionId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from("document_versions")
        .delete()
        .eq("id", versionId);

      if (deleteError) {
        throw deleteError;
      }

      // Refresh danh sách
      await refreshVersions();

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete version";
      setError(message);
      console.error("Error deleting version:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [refreshVersions]);

  return {
    versions,
    isLoading,
    error,
    createVersion,
    restoreVersion,
    deleteVersion,
    refreshVersions,
  };
}
