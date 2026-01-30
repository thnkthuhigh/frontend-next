-- Migration: 002_add_version_history.sql
-- Description: Add version history system for documents
-- Author: AI Assistant
-- Date: 2026-01-30

-- ================================================
-- 1. CREATE document_versions TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS public.document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content JSONB NOT NULL,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    description TEXT,
    
    -- Ensure unique version numbers per document
    CONSTRAINT unique_document_version UNIQUE (document_id, version_number)
);

-- ================================================
-- 2. CREATE INDEXES for Performance
-- ================================================

-- Index for querying versions by document
CREATE INDEX idx_document_versions_document_id 
ON public.document_versions(document_id);

-- Index for sorting by creation time (most recent first)
CREATE INDEX idx_document_versions_created_at 
ON public.document_versions(document_id, created_at DESC);

-- Index for created_by for user-specific queries
CREATE INDEX idx_document_versions_created_by 
ON public.document_versions(created_by);

-- ================================================
-- 3. ADD COMMENTS for Documentation
-- ================================================

COMMENT ON TABLE public.document_versions IS 
'Stores version history snapshots of documents for undo/restore functionality';

COMMENT ON COLUMN public.document_versions.version_number IS 
'Sequential version number starting from 1. Auto-incremented per document.';

COMMENT ON COLUMN public.document_versions.content IS 
'Full document content snapshot in JSONB format (same structure as documents.content)';

COMMENT ON COLUMN public.document_versions.description IS 
'Optional description: "Auto-save", "Manual save", "Before major edit", etc.';

-- ================================================
-- 4. CREATE FUNCTION to Auto-Increment Version Number
-- ================================================

CREATE OR REPLACE FUNCTION get_next_version_number(doc_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    next_version INTEGER;
BEGIN
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO next_version
    FROM public.document_versions
    WHERE document_id = doc_id;
    
    RETURN next_version;
END;
$$;

-- ================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view versions of their own documents
CREATE POLICY "Users can view their document versions"
ON public.document_versions
FOR SELECT
USING (
    document_id IN (
        SELECT id FROM public.documents
        WHERE user_id = auth.uid()
    )
);

-- Policy: Users can insert versions for their own documents
CREATE POLICY "Users can create versions for their documents"
ON public.document_versions
FOR INSERT
WITH CHECK (
    document_id IN (
        SELECT id FROM public.documents
        WHERE user_id = auth.uid()
    )
);

-- Policy: Users can delete versions of their own documents
CREATE POLICY "Users can delete their document versions"
ON public.document_versions
FOR DELETE
USING (
    document_id IN (
        SELECT id FROM public.documents
        WHERE user_id = auth.uid()
    )
);

-- ================================================
-- 6. CREATE FUNCTION to Auto-Create Version on Document Update
-- ================================================

CREATE OR REPLACE FUNCTION create_document_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only create version if content actually changed
    IF OLD.content IS DISTINCT FROM NEW.content THEN
        INSERT INTO public.document_versions (
            document_id,
            version_number,
            content,
            title,
            created_by,
            description
        ) VALUES (
            NEW.id,
            get_next_version_number(NEW.id),
            OLD.content, -- Save the OLD content before update
            OLD.title,
            auth.uid(),
            'Auto-save before update'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- ================================================
-- 7. CREATE TRIGGER for Auto-Versioning (OPTIONAL - Disabled by default)
-- ================================================

-- Uncomment to enable auto-versioning on every update:
-- CREATE TRIGGER trigger_create_document_version
-- BEFORE UPDATE ON public.documents
-- FOR EACH ROW
-- EXECUTE FUNCTION create_document_version();

-- Note: Auto-trigger is disabled by default to avoid spam.
-- Frontend will manually create versions via INSERT when needed.

-- ================================================
-- 8. UTILITY FUNCTION: Get Latest Version Number
-- ================================================

CREATE OR REPLACE FUNCTION get_latest_version_number(doc_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    latest_version INTEGER;
BEGIN
    SELECT COALESCE(MAX(version_number), 0)
    INTO latest_version
    FROM public.document_versions
    WHERE document_id = doc_id;
    
    RETURN latest_version;
END;
$$;

-- ================================================
-- 9. UTILITY FUNCTION: Clean Old Versions (Keep Last N)
-- ================================================

CREATE OR REPLACE FUNCTION cleanup_old_versions(doc_id UUID, keep_count INTEGER DEFAULT 50)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH versions_to_delete AS (
        SELECT id
        FROM public.document_versions
        WHERE document_id = doc_id
        ORDER BY created_at DESC
        OFFSET keep_count
    )
    DELETE FROM public.document_versions
    WHERE id IN (SELECT id FROM versions_to_delete);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- ================================================
-- 10. GRANT PERMISSIONS
-- ================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_next_version_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_version_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_versions(UUID, INTEGER) TO authenticated;

-- ================================================
-- MIGRATION COMPLETE
-- ================================================

-- Verify tables exist
SELECT 
    'document_versions table created successfully' AS status,
    COUNT(*) AS initial_row_count
FROM public.document_versions;
