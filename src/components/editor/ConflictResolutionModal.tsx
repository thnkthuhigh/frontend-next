'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StoredDocument } from '@/lib/storage/indexeddb';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  localVersion: StoredDocument;
  serverVersion: StoredDocument;
  onResolve: (resolution: 'local' | 'server' | 'merge') => void;
  onCancel: () => void;
}

export function ConflictResolutionModal({
  isOpen,
  localVersion,
  serverVersion,
  onResolve,
  onCancel,
}: ConflictResolutionModalProps) {
  const [selectedVersion, setSelectedVersion] = useState<'local' | 'server' | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedVersion(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleResolve = () => {
    if (selectedVersion) {
      onResolve(selectedVersion);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sync Conflict Detected
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The document has been modified in multiple places
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Choose which version to keep:
          </p>

          <div className="space-y-3">
            {/* Local Version */}
            <button
              onClick={() => setSelectedVersion('local')}
              className={cn(
                'w-full p-4 rounded-lg border-2 transition-all text-left',
                selectedVersion === 'local'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Your Local Changes
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>Modified: {formatDate(localVersion.updatedAt)}</span>
                  </div>
                  {localVersion.syncedAt && (
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Last synced: {formatDate(localVersion.syncedAt)}
                    </div>
                  )}
                </div>
                {selectedVersion === 'local' && (
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M10 3L4.5 8.5L2 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </button>

            {/* Server Version */}
            <button
              onClick={() => setSelectedVersion('server')}
              className={cn(
                'w-full p-4 rounded-lg border-2 transition-all text-left',
                selectedVersion === 'server'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-4 h-4 text-green-600 dark:text-green-400"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M3 15C3 17.8284 3 19.2426 3.87868 20.1213C4.75736 21 6.17157 21 9 21H15C17.8284 21 19.2426 21 20.1213 20.1213C21 19.2426 21 17.8284 21 15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 3V16M12 16L16 11.625M12 16L8 11.625"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Server Version
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>Modified: {formatDate(serverVersion.updatedAt)}</span>
                  </div>
                  {serverVersion.syncedAt && (
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Last synced: {formatDate(serverVersion.syncedAt)}
                    </div>
                  )}
                </div>
                {selectedVersion === 'server' && (
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M10 3L4.5 8.5L2 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              <strong>Tip:</strong> Choose "Your Local Changes" if you want to keep your recent edits,
              or "Server Version" to use the version from the cloud.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={!selectedVersion}
            className={cn(
              'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors',
              selectedVersion
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
            )}
          >
            Resolve Conflict
          </button>
        </div>
      </div>
    </div>
  );
}
