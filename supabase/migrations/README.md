# Database Migrations

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy and paste the content from the migration file
5. Click "Run" to execute the migration

### Option 2: Supabase CLI
```bash
# Make sure you're in the frontend-next directory
cd ai-doc-formatter/frontend-next

# Run the migration
supabase db push
```

## Available Migrations

### 001_add_document_status.sql
**Date**: 2026-01-30  
**Purpose**: Add `status` column to documents table to distinguish between draft and generated documents

**What it does**:
- Adds `status` column with values: 'draft' | 'generated'
- Sets default value to 'draft' for new documents
- Creates index for efficient status filtering
- Updates existing documents based on content

**After running**:
- All new documents will be created with status 'draft'
- Documents will auto-update to 'generated' when content is added
- Dashboard will show "Draft" badge for draft documents
- Editor will show correct view based on document status

## Rollback

If you need to rollback this migration:

```sql
-- Remove status column
ALTER TABLE public.documents DROP COLUMN IF EXISTS status;

-- Remove index
DROP INDEX IF EXISTS idx_documents_status;
```

## Verify Migration

After running the migration, verify it worked:

```sql
-- Check if column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'documents' AND column_name = 'status';

-- Check existing documents
SELECT id, title, status FROM public.documents LIMIT 10;
```
