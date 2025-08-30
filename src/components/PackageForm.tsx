'use client'

import { useState, useEffect } from 'react'
import { Package, PackageInsert, PackageUpdate, PackageFile } from '@/types/package'
import { packageService } from '@/lib/packageService'
import { useAuth } from './AuthProvider'
import FileUpload from './FileUpload'
import { DELIVERY_STATUSES, DATA_PROCESSING_STATUSES } from '@/lib/supabase'

interface PackageFormProps {
  package?: Package
  onClose: () => void
  onSuccess: () => void
}

export default function PackageForm({ package: pkg, onClose, onSuccess }: PackageFormProps) {
  const [formData, setFormData] = useState({
    package_number: '',
    shipper_name: '',
    shipping_date: '',
    estimated_arrival_date: '',
    delivery_status: DELIVERY_STATUSES[0] as typeof DELIVERY_STATUSES[number],
    data_processing_status: DATA_PROCESSING_STATUSES[0] as typeof DATA_PROCESSING_STATUSES[number],
    remarks: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdPackageId, setCreatedPackageId] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<PackageFile[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (pkg) {
      setFormData({
        package_number: pkg.package_number,
        shipper_name: pkg.shipper_name,
        shipping_date: pkg.shipping_date,
        estimated_arrival_date: pkg.estimated_arrival_date,
        delivery_status: pkg.delivery_status,
        data_processing_status: pkg.data_processing_status,
        remarks: pkg.remarks || ''
      })
    }
  }, [pkg])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      if (pkg) {
        // 編集の場合
        const updates: PackageUpdate = {
          package_number: formData.package_number,
          shipper_name: formData.shipper_name,
          shipping_date: formData.shipping_date,
          estimated_arrival_date: formData.estimated_arrival_date,
          delivery_status: formData.delivery_status,
          data_processing_status: formData.data_processing_status,
          remarks: formData.remarks || null
        }
        await packageService.updatePackage(pkg.id, updates, user.id)
        onSuccess()
        onClose()
      } else {
        // 新規作成の場合
        const insertData: PackageInsert = {
          package_number: formData.package_number,
          shipper_name: formData.shipper_name,
          shipping_date: formData.shipping_date,
          estimated_arrival_date: formData.estimated_arrival_date,
          delivery_status: formData.delivery_status,
          data_processing_status: formData.data_processing_status,
          remarks: formData.remarks || null,
          created_by: user.id
        }
        const newPackage = await packageService.createPackage(insertData)
        setCreatedPackageId(newPackage.id)
        // 新規作成後もフォームを表示してファイルアップロードを可能にする
      }
    } catch (err) {
      setError((err as Error).message || '保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUploaded = (file: PackageFile) => {
    setUploadedFiles(prev => [...prev, file])
  }

  const handleFinish = () => {
    onSuccess()
    onClose()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // const isDataProcessingRequired = formData.data_processing_status !== '予約無し' // 未使用のためコメントアウト

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4">
      <div className="relative bg-white p-6 rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {pkg ? '荷物情報編集' : (createdPackageId ? '荷物追加完了' : '新規荷物追加')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {!pkg && !createdPackageId ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                荷物番号 *
              </label>
              <input
                type="text"
                name="package_number"
                required
                value={formData.package_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              発送元名 *
            </label>
            <input
              type="text"
              name="shipper_name"
              required
              value={formData.shipper_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                発送日 *
              </label>
              <input
                type="date"
                name="shipping_date"
                required
                value={formData.shipping_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                到着予定日 *
              </label>
              <input
                type="date"
                name="estimated_arrival_date"
                required
                value={formData.estimated_arrival_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                配送ステータス *
              </label>
              <select
                name="delivery_status"
                required
                value={formData.delivery_status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {DELIVERY_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                データ処理ステータス *
              </label>
              <select
                name="data_processing_status"
                required
                value={formData.data_processing_status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {DATA_PROCESSING_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              備考
            </label>
            <textarea
              name="remarks"
              rows={3}
              value={formData.remarks}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="備考があれば入力してください"
            />
          </div>

          {/* ファイルアップロード */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              納品書・資料のアップロード
            </label>
            {(pkg?.id || createdPackageId) && (
              <FileUpload
                packageId={pkg?.id || createdPackageId!}
                onFileUploaded={handleFileUploaded}
              />
            )}
            {uploadedFiles.length > 0 && (
              <div className="mt-2 text-sm text-green-600">
                ✅ {uploadedFiles.length}個のファイルがアップロードされました
              </div>
            )}
            {!pkg && !createdPackageId && (
              <p className="text-sm text-gray-500">
                荷物情報を保存後にファイルをアップロードできます
              </p>
            )}
          </div>


          {/* データ処理ステータス関連の説明 */}
          <div className={`border rounded-md p-3 ${
            formData.data_processing_status === '予約無し' 
              ? 'bg-yellow-50 border-yellow-200' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {formData.data_processing_status === '予約無し' ? (
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                {formData.data_processing_status === '予約無し' ? (
                  <p className="text-sm text-yellow-700">
                    「予約無し」を選択した場合、追加のデータ処理は不要です。
                  </p>
                ) : (
                  <p className="text-sm text-blue-700">
                    <strong>「{formData.data_processing_status}」</strong>を選択した場合、
                    送り状データ処理と受注データ確認の両方が必要です。
                  </p>
                )}
              </div>
            </div>
          </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '保存中...' : (pkg ? '更新' : '追加')}
              </button>
            </div>
          </form>
        ) : pkg ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                荷物番号 *
              </label>
              <input
                type="text"
                name="package_number"
                required
                value={formData.package_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              発送元名 *
            </label>
            <input
              type="text"
              name="shipper_name"
              required
              value={formData.shipper_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                発送日 *
              </label>
              <input
                type="date"
                name="shipping_date"
                required
                value={formData.shipping_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                到着予定日 *
              </label>
              <input
                type="date"
                name="estimated_arrival_date"
                required
                value={formData.estimated_arrival_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                配送ステータス *
              </label>
              <select
                name="delivery_status"
                required
                value={formData.delivery_status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {DELIVERY_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                データ処理ステータス *
              </label>
              <select
                name="data_processing_status"
                required
                value={formData.data_processing_status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {DATA_PROCESSING_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              備考
            </label>
            <textarea
              name="remarks"
              rows={3}
              value={formData.remarks}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="備考があれば入力してください"
            />
          </div>

          {/* ファイルアップロード */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              納品書・資料のアップロード
            </label>
            {(pkg?.id || createdPackageId) && (
              <FileUpload
                packageId={pkg?.id || createdPackageId!}
                onFileUploaded={handleFileUploaded}
              />
            )}
            {uploadedFiles.length > 0 && (
              <div className="mt-2 text-sm text-green-600">
                ✅ {uploadedFiles.length}個のファイルがアップロードされました
              </div>
            )}
            {!pkg && !createdPackageId && (
              <p className="text-sm text-gray-500">
                荷物情報を保存後にファイルをアップロードできます
              </p>
            )}
          </div>

          {/* データ処理ステータス関連の説明 */}
          <div className={`border rounded-md p-3 ${
            formData.data_processing_status === '予約無し' 
              ? 'bg-yellow-50 border-yellow-200' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {formData.data_processing_status === '予約無し' ? (
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                {formData.data_processing_status === '予約無し' ? (
                  <p className="text-sm text-yellow-700">
                    「予約無し」を選択した場合、追加のデータ処理は不要です。
                  </p>
                ) : (
                  <p className="text-sm text-blue-700">
                    <strong>「{formData.data_processing_status}」</strong>を選択した場合、
                    送り状データ処理と受注データ確認の両方が必要です。
                  </p>
                )}
              </div>
            </div>
          </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '保存中...' : '更新'}
              </button>
            </div>
          </form>
        ) : (
          /* 荷物作成完了後のファイルアップロード画面 */
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-green-600 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">荷物情報を登録しました！</h4>
              <p className="text-gray-600 mb-6">必要に応じて納品書や関連資料をアップロードしてください。</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                納品書・資料のアップロード
              </label>
              <FileUpload
                packageId={createdPackageId}
                onFileUploaded={handleFileUploaded}
              />
              {uploadedFiles.length > 0 && (
                <div className="mt-2 text-sm text-green-600">
                  ✅ {uploadedFiles.length}個のファイルがアップロードされました
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleFinish}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                完了
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}