import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch user's documents - Only select metadata for performance
  // Don't fetch 'content' JSONB to avoid loading large Tiptap documents
  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, title, status, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching documents:', error)
  }

  return (
    <DashboardClient 
      user={user} 
      initialDocuments={documents || []} 
    />
  )
}
