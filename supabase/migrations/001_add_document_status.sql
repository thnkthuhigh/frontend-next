-- =============================================
-- Migration: Add document status column
-- Date: 2026-01-30
-- Description: Add status column to distinguish draft vs generated documents
-- =============================================

-- 1. Add status column with default 'draft'
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
CHECK (status IN ('draft', 'generated'));

-- 2. Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);

-- 3. Update existing documents based on content
-- If content has nodes other than empty paragraph, mark as 'generated'
UPDATE public.documents
SET status = CASE
    WHEN jsonb_array_length(content->'content') > 0 
         AND content->'content'->0->>'type' != 'paragraph'
         OR (content->'content'->0->'content' IS NOT NULL 
             AND jsonb_array_length(content->'content'->0->'content') > 0)
    THEN 'generated'
    ELSE 'draft'
END;

-- =============================================
-- DONE! Status column added.
-- Run this in Supabase SQL Editor
-- =============================================
