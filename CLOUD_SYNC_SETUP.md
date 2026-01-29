# 🚀 Cloud Sync & Multi-User Setup Guide

## Overview
This guide explains how to set up the SaaS features for AI Document Formatter, including:
- 🔐 User Authentication (Email/Password, Google OAuth)
- 🗄️ Cloud Database (Supabase PostgreSQL)
- 🏠 Dashboard (Document management)
- ☁️ Auto-Sync (Real-time saving)

## Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier works!)
- (Optional) Google Cloud Console for OAuth

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Project name**: `ai-doc-formatter`
   - **Database password**: (save this somewhere safe!)
   - **Region**: Choose closest to your users
4. Click "Create new project" and wait ~2 minutes

---

## Step 2: Get API Keys

1. In your Supabase project, go to **Settings** > **API**
2. Copy these values:
   - `Project URL` → This is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

---

## Step 4: Set Up Database Schema

1. In Supabase, go to **SQL Editor**
2. Click "New query"
3. Copy the contents of `supabase/schema.sql` and paste into the editor
4. Click "Run" to execute
5. You should see success messages for each table and policy created

---

## Step 5: Configure Authentication

### Email/Password Auth
Already enabled by default in Supabase.

### Google OAuth (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - `https://your-project-id.supabase.co/auth/v1/callback`
7. Copy **Client ID** and **Client Secret**
8. In Supabase: **Authentication** > **Providers** > **Google**
9. Enable and paste your Client ID and Secret

---

## Step 6: Run the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│  /                 → Landing page (DocumentFormatter)        │
│  /login            → Login page (Email/Google)               │
│  /register         → Registration page                       │
│  /dashboard        → Document list & management              │
│  /editor/[id]      → Edit specific document                  │
│  /auth/callback    → OAuth callback handler                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase (Backend)                        │
├─────────────────────────────────────────────────────────────┤
│  Auth        → User authentication & sessions                │
│  PostgreSQL  → users, documents tables                       │
│  RLS         → Row Level Security (users see only own docs)  │
│  Storage     → (Future: file attachments)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### users table
| Column     | Type      | Description              |
|------------|-----------|--------------------------|
| id         | UUID (PK) | Links to auth.users      |
| email      | TEXT      | User's email             |
| full_name  | TEXT      | Display name             |
| avatar_url | TEXT      | Profile picture URL      |
| created_at | TIMESTAMP | Account creation time    |
| updated_at | TIMESTAMP | Last update time         |

### documents table
| Column     | Type      | Description              |
|------------|-----------|--------------------------|
| id         | UUID (PK) | Document unique ID       |
| user_id    | UUID (FK) | Owner user ID            |
| title      | TEXT      | Document title           |
| content    | JSONB     | Tiptap JSON content      |
| created_at | TIMESTAMP | Creation time            |
| updated_at | TIMESTAMP | Last save time           |

---

## Auto-Sync Feature

The auto-sync feature automatically saves document changes to the cloud:

1. **Debounce**: Changes are batched with a 1.5-second delay
2. **Smart Diff**: Only saves when content actually changes
3. **Status Indicator**: Shows "Saving...", "Saved", or error state
4. **Offline Support**: (Future) Queue changes when offline

```typescript
// In editor-client.tsx
const { isSaving, lastSaved, saveError } = useAutoSave(
  documentId,
  contentToSave,
  title,
  1500 // 1.5 second debounce
);
```

---

## Security Features

- **Row Level Security (RLS)**: Users can only access their own documents
- **JWT Authentication**: Secure token-based auth via Supabase
- **PKCE OAuth Flow**: Secure Google login
- **Middleware Protection**: Dashboard routes require authentication

---

## Troubleshooting

### "Failed to fetch documents"
- Check your Supabase URL and anon key in `.env.local`
- Ensure you've run the schema SQL

### "Google login not working"
- Verify redirect URI matches exactly
- Check Google OAuth credentials are enabled in Supabase

### "Document not saving"
- Check browser console for errors
- Verify RLS policies are created
- Ensure user_id matches authenticated user

---

## Next Steps

1. **Storage**: Add file attachments with Supabase Storage
2. **Real-time**: Collaborative editing with Supabase Realtime
3. **Teams**: Share documents with other users
4. **Billing**: Integrate Stripe for premium features
