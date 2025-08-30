'use client'

import { useState, useEffect } from 'react'
import { Package, PackageFile, PackageStatusHistory } from '@/types/package'
import { packageService } from '@/lib/packageService'
import { fileService } from '@/lib/fileService'
import { useAuth } from './AuthProvider'
import FileUpload from './FileUpload'
import FileList from './FileList'

interface PackageDetailProps {
  packageId: string
  onClose: () => void
}

export default function PackageDetail({ packageId, onClose }: PackageDetailProps) {
  const [pkg, setPkg] = useState<Package | null>(null)
  const [files, setFiles] = useState<PackageFile[]>([])
  const [history, setHistory] = useState<PackageStatusHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'files' | 'history'>('details')
  // const { user } = useAuth() // 未使用のためコメントアウト

  useEffect(() => {
    loadPackageData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageId])

  const loadPackageData = async () => {
    try {
      setLoading(true)
      const [packageData, packageFiles, packageHistory] = await Promise.all([
        packageService.getPackageById(packageId),
        fileService.getPackageFiles(packageId),
        packageService.getPackageHistory(packageId)
      ])
      
      setPkg(packageData)
      setFiles(packageFiles)
      setHistory(packageHistory)
    } catch (err) {
      setError('データの読み込みに失敗しました')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUploaded = (newFile: PackageFile) => {
    setFiles(prev => [newFile, ...prev])
  }

  const handleFilesChange = (updatedFiles: PackageFile[]) => {
    setFiles(updatedFiles)
  }

  const getStatusColor = (status: string) => {
    const deliveryColors: { [key: string]: string } = {
      '輸送中（航空便）': 'bg-blue-100 text-blue-800',
      '輸送中（船便）': 'bg-indigo-100 text-indigo-800',
      '国内陸送中': 'bg-yellow-100 text-yellow-800',
      '到着（未確認）': 'bg-orange-100 text-orange-800',
      '処理済み': 'bg-green-100 text-green-800'
    }
    
    const dataColors: { [key: string]: string } = {
      '送り状データ処理済み': 'bg-green-100 text-green-800',
      '受注データ確認済み': 'bg-blue-100 text-blue-800',
      '予約無し': 'bg-gray-100 text-gray-800'
    }

    return deliveryColors[status] || dataColors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6">
          <div className="text-gray-600">読み込み中...</div>
        </div>
      </div>
    )
  }

  if (error || !pkg) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <div className="text-red-600 mb-4">{error || 'パッケージが見つかりません'}</div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            閉じる
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-8 mx-auto p-6 border w-full max-w-4xl bg-white rounded-lg shadow-lg mb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{pkg.package_number}</h2>
            <p className="text-gray-600">{pkg.shipper_name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="text-3xl">&times;</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              詳細情報
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'files'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ファイル ({files.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              履歴 ({history.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">発送日</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(pkg.shipping_date).toLocaleDateString('ja-JP')}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">到着予定日</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(pkg.estimated_arrival_date).toLocaleDateString('ja-JP')}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">配送ステータス</label>
                <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pkg.delivery_status)}`}>
                  {pkg.delivery_status}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">データ処理ステータス</label>
                <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pkg.data_processing_status)}`}>
                  {pkg.data_processing_status}
                </span>
              </div>
            </div>
            
            {pkg.remarks && (
              <div>
                <label className="block text-sm font-medium text-gray-700">備考</label>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {pkg.remarks}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700">作成日時</label>
                <p className="mt-1 text-sm text-gray-500">
                  {new Date(pkg.created_at).toLocaleString('ja-JP')}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">最終更新日時</label>
                <p className="mt-1 text-sm text-gray-500">
                  {new Date(pkg.updated_at).toLocaleString('ja-JP')}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">ファイルアップロード</h3>
              <FileUpload
                packageId={packageId}
                onFileUploaded={handleFileUploaded}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">アップロード済みファイル</h3>
              <FileList
                packageId={packageId}
                files={files}
                onFilesChange={handleFilesChange}
              />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">変更履歴</h3>
            {history.length === 0 ? (
              <p className="text-gray-500">変更履歴がありません</p>
            ) : (
              <div className="space-y-4">
                {history.map((record) => (
                  <div key={record.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {record.field_name}の変更
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(record.changed_at).toLocaleString('ja-JP')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="line-through">{record.old_value || '(空)'}</span>
                      {' → '}
                      <span className="font-medium">{record.new_value || '(空)'}</span>
                    </div>
                    {record.reason && (
                      <div className="mt-2 text-sm text-gray-600">
                        理由: {record.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}