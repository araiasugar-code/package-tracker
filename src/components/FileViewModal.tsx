'use client'

import { useState, useEffect } from 'react'
import { PackageFile } from '@/types/package'
import { fileService } from '@/lib/fileService'

interface FileViewModalProps {
  file: PackageFile
  isOpen: boolean
  onClose: () => void
}

export default function FileViewModal({ file, isOpen, onClose }: FileViewModalProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (isOpen && file) {
      loadFileUrl()
    }
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl)
      }
    }
  }, [isOpen, file])

  const loadFileUrl = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = await fileService.getFileUrl(file.file_path)
      setFileUrl(url)
    } catch (err) {
      setError('ファイルの読み込みに失敗しました')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
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
      setError('ダウンロードに失敗しました')
      console.error(err)
    } finally {
      setDownloading(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const isImage = file.mime_type.startsWith('image/')
  const isPdf = file.mime_type === 'application/pdf'

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {file.file_name}
            </h3>
            <p className="text-sm text-gray-500">
              {(file.file_size / 1024 / 1024).toFixed(2)} MB • {new Date(file.created_at).toLocaleString('ja-JP')}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{downloading ? 'ダウンロード中...' : 'ダウンロード'}</span>
            </button>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-auto">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-center">
              {error}
            </div>
          )}
          
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-gray-600">読み込み中...</span>
            </div>
          )}
          
          {!loading && !error && fileUrl && (
            <div className="flex justify-center">
              {isImage ? (
                <img 
                  src={fileUrl} 
                  alt={file.file_name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              ) : isPdf ? (
                <iframe 
                  src={fileUrl} 
                  className="w-full h-96 border rounded-lg"
                  title={file.file_name}
                />
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-2 text-gray-500">
                    このファイル形式はプレビューできません
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    ダウンロードしてご確認ください
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}