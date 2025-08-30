'use client'

import { useState, useRef } from 'react'
import { PackageFile } from '@/types/package'
import { fileService } from '@/lib/fileService'
import { useAuth } from './AuthProvider'

interface FileUploadProps {
  packageId: string
  onFileUploaded: (file: PackageFile) => void
}

export default function FileUpload({ packageId, onFileUploaded }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return

    const file = files[0]
    
    if (!fileService.isValidFileType(file)) {
      setError('JPG、PNG、PDFファイルのみアップロード可能です')
      return
    }

    if (!fileService.isValidFileSize(file)) {
      setError('ファイルサイズは10MB以下にしてください')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const uploadedFile = await fileService.uploadFile(packageId, file, user.id)
      onFileUploaded(uploadedFile)
    } catch (err) {
      setError('ファイルのアップロードに失敗しました')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={handleInputChange}
        className="hidden"
      />
      
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragActive 
            ? 'border-indigo-400 bg-indigo-50' 
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
          }
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-sm text-gray-600">アップロード中...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600 mt-4">
              <span className="font-medium text-indigo-600 hover:text-indigo-500">
                ファイルを選択
              </span>
              <p className="pl-1">またはドラッグ&ドロップ</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              JPG, PNG, PDF（最大10MB）
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  )
}