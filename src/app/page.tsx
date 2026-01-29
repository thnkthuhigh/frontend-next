'use client'

import { DocumentFormatter } from '@/components/document-formatter'
import { ErrorBoundary } from '@/components/error-boundary'

export default function Home() {
  return (
    <ErrorBoundary>
      <DocumentFormatter />
    </ErrorBoundary>
  )
}
