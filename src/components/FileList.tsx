'use client'

import { useState, useEffect } from 'react'
import { PackageFile } from '@/types/package'
import { fileService } from '@/lib/fileService'
import FileViewModal from './FileViewModal'

interface FileListProps {
  packageId: string
  files: PackageFile[]
  onFilesChange: (files: PackageFile[]) => void
}

export default function FileList({ packageId, files, onFilesChange }: FileListProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<PackageFile | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleDelete = async (fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (!file) return

    if (!confirm(`ファイル「${file.file_name}」を削除しますか？`)) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      await fileService.deleteFile(fileId)
      const updatedFiles = files.filter(f => f.id !== fileId)
      onFilesChange(updatedFiles)
    } catch (err: any) {
      setError('ファイルの削除に失敗しました')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (file: PackageFile) => {
    try {
      const blob = await fileService.downloadFile(file.file_path)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('ファイルのダウンロードに失敗しました')
      console.error(err)
    }
  }

  const handlePreview = (file: PackageFile) => {
    setSelectedFile(file)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setSelectedFile(null)
    setIsModalOpen(false)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return (
        <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      )
    } else if (mimeType === 'application/pdf') {
      return (
        <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      )
    }
    return (
      <svg className="h-8 w-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    )
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        アップロードされたファイルがありません
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}
      
      <div className="grid gap-3">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              {getFileIcon(file.mime_type)}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.file_name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleString('ja-JP')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePreview(file)}
                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                title="閲覧"
              >
                閲覧
              </button>
              
              <button
                onClick={() => handleDownload(file)}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                title="ダウンロード"
              >
                ダウンロード
              </button>
              
              <button
                onClick={() => handleDelete(file.id)}
                disabled={loading}
                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-50"
                title="削除"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Modal for file preview */}
      {selectedFile && (
        <FileViewModal
          file={selectedFile}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}