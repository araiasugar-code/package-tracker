'use client'

import { useState } from 'react'
import { PackageFile } from '@/types/package'
import { fileService } from '@/lib/fileService'

interface FileViewerProps {
  packageId: string
  files: PackageFile[]
  onClose: () => void
}

export default function FileViewer({ files, onClose }: FileViewerProps) {
  const [downloading, setDownloading] = useState<{[key: string]: boolean}>({})
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async (file: PackageFile) => {
    try {
      setDownloading(prev => ({ ...prev, [file.id]: true }))
      setError(null)
      
      const url = await fileService.getFileUrl(file.file_path)
      
      // Create download link
      const link = document.createElement('a')
      link.href = url
      link.download = file.file_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      setError(`ファイルのダウンロードに失敗しました: ${err instanceof Error ? err.message : String(err)}`)
      console.error('Download error:', err)
    } finally {
      setDownloading(prev => ({ ...prev, [file.id]: false }))
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
    return '📁'
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4">
      <div className="relative bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            アップロードファイル ({files.length}件)
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {files.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">アップロードされたファイルはありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div key={file.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="text-2xl">{getFileIcon(file.mime_type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.file_name}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>{formatFileSize(file.file_size)}</span>
                        <span>{new Date(file.created_at).toLocaleDateString('ja-JP')}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(file)}
                    disabled={downloading[file.id]}
                    className="ml-4 px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloading[file.id] ? 'ダウンロード中...' : 'ダウンロード'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}