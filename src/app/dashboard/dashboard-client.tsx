"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/database.types";
import {
  Plus,
  FileText,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  LogOut,
  Sparkles,
  Clock,
  FolderOpen,
  Loader2,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "@/lib/date-utils";
import { motion, AnimatePresence } from "framer-motion";
import { DocumentListSkeleton } from "@/components/ui/animations";

type Document = Database["public"]["Tables"]["documents"]["Row"];

interface DashboardClientProps {
  user: User;
  initialDocuments: Document[];
}

export function DashboardClient({ user, initialDocuments }: DashboardClientProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateDocument = useCallback(async () => {
    setIsCreating(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          title: "Untitled Document",
          content: { type: "doc", content: [] },
          status: 'draft',
        } as never)
        .select()
        .single();

      if (error) throw error;

      // Navigate to editor with the new document
      router.push(`/editor/${(data as { id: string }).id}`);
    } catch (error) {
      console.error("Error creating document:", error);
    } finally {
      setIsCreating(false);
    }
  }, [user.id, router]);

  const handleOpenDocument = useCallback((docId: string) => {
    router.push(`/editor/${docId}`);
  }, [router]);

  const handleRenameDocument = useCallback(async (docId: string, newTitle: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("documents")
        .update({ title: newTitle, updated_at: new Date().toISOString() } as never)
        .eq("id", docId);

      if (error) throw error;

      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === docId ? { ...doc, title: newTitle, updated_at: new Date().toISOString() } : doc
        )
      );
    } catch (error) {
      console.error("Error renaming document:", error);
    } finally {
      setEditingId(null);
      setEditingTitle("");
    }
  }, []);

  const handleDeleteDocument = useCallback(async (docId: string) => {
    setDeletingId(docId);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("documents").delete().eq("id", docId);

      if (error) throw error;

      setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    } catch (error) {
      console.error("Error deleting document:", error);
    } finally {
      setDeletingId(null);
      setShowMenu(null);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    
    // P1-UX-003: Clear Zustand persisted storage to prevent data leakage
    // This ensures next user doesn't see previous user's cached data
    try {
      localStorage.removeItem('ai-doc-formatter-storage');
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
    
    router.push("/");
    router.refresh();
  }, [router]);

  const startEditing = (doc: Document) => {
    setEditingId(doc.id);
    setEditingTitle(doc.title);
    setShowMenu(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border backdrop-blur-xl bg-background/80">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Sparkles className="w-6 h-6 text-amber-500" />
              </div>
              <span className="font-bold text-xl text-foreground">AI Doc Formatter</span>
            </Link>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">{user.user_metadata?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-zinc-700 dark:bg-zinc-300 flex items-center justify-center text-zinc-100 dark:text-zinc-800 font-semibold">
                {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
              </div>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <LogOut size={18} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Documents</h1>
            <p className="text-muted-foreground mt-1">Create and manage your AI-formatted documents</p>
          </div>
          <Button
            onClick={handleCreateDocument}
            disabled={isCreating}
            className="h-12 px-6 rounded-xl font-semibold text-white shrink-0"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
            }}
          >
            {isCreating ? (
              <Loader2 className="animate-spin mr-2" size={18} />
            ) : (
              <Plus className="mr-2" size={18} />
            )}
            New Document
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="h-12 pl-12 bg-muted border-border hover:border-primary/30 focus:border-primary rounded-xl text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex p-6 rounded-full bg-muted mb-6">
              <FolderOpen className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {searchQuery ? "No documents found" : "No documents yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? "Try a different search term"
                : "Create your first document to get started"}
            </p>
            {!searchQuery && (
              <Button
                onClick={handleCreateDocument}
                disabled={isCreating}
                className="h-12 px-6 rounded-xl font-semibold text-zinc-900 bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/25"
              >
                <Plus className="mr-2" size={18} />
                Create Document
              </Button>
            )}
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.05 }
              }
            }}
          >
            <AnimatePresence>
            {filteredDocuments.map((doc, index) => (
              <motion.div
                key={doc.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative bg-card hover:bg-card-hover border border-border hover:border-amber-500/30 rounded-2xl p-5 cursor-pointer hover:shadow-lg hover:shadow-amber-500/5"
                onClick={() => handleOpenDocument(doc.id)}
              >
                {/* Document Icon */}
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-amber-500" />
                </div>

                {/* Title */}
                {editingId === doc.id ? (
                  <div className="flex items-center gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRenameDocument(doc.id, editingTitle);
                        } else if (e.key === "Escape") {
                          setEditingId(null);
                        }
                      }}
                      className="h-8 text-sm bg-muted border-border"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRenameDocument(doc.id, editingTitle)}
                      className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <h3 className="font-semibold text-foreground truncate mb-2">{doc.title}</h3>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock size={12} />
                    <span>{formatDistanceToNow(new Date(doc.updated_at))}</span>
                  </div>
                  {/* Status Badge */}
                  {doc.status === 'draft' && (
                    <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px] font-medium">
                      Draft
                    </span>
                  )}
                </div>

                {/* Menu Button */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(showMenu === doc.id ? null : doc.id);
                    }}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {/* Dropdown Menu */}
                  {showMenu === doc.id && (
                    <div
                      className="absolute right-0 top-10 w-40 rounded-xl bg-popover dark:bg-[#1a1c24] border border-border shadow-2xl overflow-hidden z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => startEditing(doc)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-muted"
                      >
                        <Pencil size={14} />
                        Rename
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        disabled={deletingId === doc.id}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        {deletingId === doc.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
}
