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

export default function PackageForm({ package: packageProp, onClose, onSuccess }: PackageFormProps) {
  const [formData, setFormData] = useState({
    package_number: '',
    shipper_name: '',
    shipping_date: '',
    estimated_arrival_date: '',
    delivery_status: DELIVERY_STATUSES[0] as typeof DELIVERY_STATUSES[number],
    remarks: '',
    has_reservation: true,
    order_data_confirmed: false,
    shipping_data_processed: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdPackageId, setCreatedPackageId] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<PackageFile[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (packageProp) {
      setFormData({
        package_number: packageProp.package_number,
        shipper_name: packageProp.shipper_name,
        shipping_date: packageProp.shipping_date,
        estimated_arrival_date: packageProp.estimated_arrival_date,
        delivery_status: packageProp.delivery_status,
        remarks: packageProp.remarks || '',
        has_reservation: packageProp.has_reservation ?? true,
        order_data_confirmed: packageProp.order_data_confirmed ?? false,
        shipping_data_processed: packageProp.shipping_data_processed ?? false
      })
    }
  }, [packageProp])

  // データ処理ステータスを計算する関数
  const calculateDataProcessingStatus = () => {
    if (!formData.has_reservation) {
      return '予約無し'
    }
    
    const { order_data_confirmed, shipping_data_processed } = formData
    
    if (order_data_confirmed && shipping_data_processed) {
      return '処理完了'
    } else if (order_data_confirmed) {
      return '受注データ確認済み'
    } else if (shipping_data_processed) {
      return '送り状データ処理済み'
    } else {
      return '処理待ち'
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      if (packageProp) {
        // 編集の場合
        const updates: PackageUpdate = {
          package_number: formData.package_number,
          shipper_name: formData.shipper_name,
          shipping_date: formData.shipping_date,
          estimated_arrival_date: formData.estimated_arrival_date,
          delivery_status: formData.delivery_status,
          data_processing_status: calculateDataProcessingStatus(),
          has_reservation: formData.has_reservation,
          order_data_confirmed: formData.order_data_confirmed,
          shipping_data_processed: formData.shipping_data_processed,
          remarks: formData.remarks || null
        }
        await packageService.updatePackage(packageProp.id, updates, user.id)
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
          data_processing_status: calculateDataProcessingStatus(),
          has_reservation: formData.has_reservation,
          order_data_confirmed: formData.order_data_confirmed,
          shipping_data_processed: formData.shipping_data_processed,
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
            {packageProp ? '荷物情報編集' : (createdPackageId ? '荷物追加完了' : '新規荷物追加')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {!packageProp && !createdPackageId ? (
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                データ処理設定
              </label>
              <div className="space-y-3">
                {/* 予約の有無 */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="has_reservation"
                    name="has_reservation"
                    checked={formData.has_reservation}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      has_reservation: e.target.checked,
                      // 予約なしにした場合は処理フラグをリセット
                      order_data_confirmed: e.target.checked ? prev.order_data_confirmed : false,
                      shipping_data_processed: e.target.checked ? prev.shipping_data_processed : false
                    }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="has_reservation" className="ml-2 text-sm text-gray-700">
                    予約受注商品が含まれている
                  </label>
                </div>
                
                {/* 予約ありの場合の処理項目 */}
                {formData.has_reservation && (
                  <div className="ml-6 space-y-2 border-l-2 border-indigo-200 pl-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="order_data_confirmed"
                        name="order_data_confirmed"
                        checked={formData.order_data_confirmed}
                        onChange={(e) => setFormData(prev => ({ ...prev, order_data_confirmed: e.target.checked }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="order_data_confirmed" className="ml-2 text-sm text-gray-700">
                        受注データ確認済み
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="shipping_data_processed"
                        name="shipping_data_processed"
                        checked={formData.shipping_data_processed}
                        onChange={(e) => setFormData(prev => ({ ...prev, shipping_data_processed: e.target.checked }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="shipping_data_processed" className="ml-2 text-sm text-gray-700">
                        送り状データ処理済み
                      </label>
                    </div>
                  </div>
                )}
              </div>
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
            {(packageProp || createdPackageId) && (
              <FileUpload
                packageId={packageProp && 'id' in packageProp ? (packageProp as Package).id : (createdPackageId || '')}
                onFileUploaded={handleFileUploaded}
              />
            )}
            {uploadedFiles.length > 0 && (
              <div className="mt-2 text-sm text-green-600">
                ✅ {uploadedFiles.length}個のファイルがアップロードされました
              </div>
            )}
            {!packageProp && !createdPackageId && (
              <p className="text-sm text-gray-500">
                荷物情報を保存後にファイルをアップロードできます
              </p>
            )}
          </div>


          {/* データ処理ステータス関連の説明 */}
          <div className={`border rounded-md p-3 ${
            !formData.has_reservation
              ? 'bg-gray-50 border-gray-200' 
              : formData.order_data_confirmed && formData.shipping_data_processed
              ? 'bg-green-50 border-green-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {!formData.has_reservation ? (
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : formData.order_data_confirmed && formData.shipping_data_processed ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  ステータス: <strong>{calculateDataProcessingStatus()}</strong>
                </p>
                {!formData.has_reservation ? (
                  <p className="text-xs text-gray-600 mt-1">
                    予約受注商品が含まれていないため、データ処理は不要です。
                  </p>
                ) : formData.order_data_confirmed && formData.shipping_data_processed ? (
                  <p className="text-xs text-green-600 mt-1">
                    すべての処理が完了しています。
                  </p>
                ) : (
                  <p className="text-xs text-blue-600 mt-1">
                    {!formData.order_data_confirmed && !formData.shipping_data_processed && "受注データ確認と送り状データ処理が必要です。"}
                    {formData.order_data_confirmed && !formData.shipping_data_processed && "送り状データ処理が必要です。"}
                    {!formData.order_data_confirmed && formData.shipping_data_processed && "受注データ確認が必要です。"}
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
                {loading ? '保存中...' : (packageProp ? '更新' : '追加')}
              </button>
            </div>
          </form>
        ) : packageProp ? (
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                データ処理設定
              </label>
              <div className="space-y-3">
                {/* 予約の有無 */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="has_reservation"
                    name="has_reservation"
                    checked={formData.has_reservation}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      has_reservation: e.target.checked,
                      // 予約なしにした場合は処理フラグをリセット
                      order_data_confirmed: e.target.checked ? prev.order_data_confirmed : false,
                      shipping_data_processed: e.target.checked ? prev.shipping_data_processed : false
                    }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="has_reservation" className="ml-2 text-sm text-gray-700">
                    予約受注商品が含まれている
                  </label>
                </div>
                
                {/* 予約ありの場合の処理項目 */}
                {formData.has_reservation && (
                  <div className="ml-6 space-y-2 border-l-2 border-indigo-200 pl-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="order_data_confirmed"
                        name="order_data_confirmed"
                        checked={formData.order_data_confirmed}
                        onChange={(e) => setFormData(prev => ({ ...prev, order_data_confirmed: e.target.checked }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="order_data_confirmed" className="ml-2 text-sm text-gray-700">
                        受注データ確認済み
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="shipping_data_processed"
                        name="shipping_data_processed"
                        checked={formData.shipping_data_processed}
                        onChange={(e) => setFormData(prev => ({ ...prev, shipping_data_processed: e.target.checked }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="shipping_data_processed" className="ml-2 text-sm text-gray-700">
                        送り状データ処理済み
                      </label>
                    </div>
                  </div>
                )}
              </div>
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
            {(packageProp || createdPackageId) && (
              <FileUpload
                packageId={packageProp && 'id' in packageProp ? (packageProp as Package).id : (createdPackageId || '')}
                onFileUploaded={handleFileUploaded}
              />
            )}
            {uploadedFiles.length > 0 && (
              <div className="mt-2 text-sm text-green-600">
                ✅ {uploadedFiles.length}個のファイルがアップロードされました
              </div>
            )}
            {!packageProp && !createdPackageId && (
              <p className="text-sm text-gray-500">
                荷物情報を保存後にファイルをアップロードできます
              </p>
            )}
          </div>

          {/* データ処理ステータス関連の説明 */}
          <div className={`border rounded-md p-3 ${
            !formData.has_reservation
              ? 'bg-gray-50 border-gray-200' 
              : formData.order_data_confirmed && formData.shipping_data_processed
              ? 'bg-green-50 border-green-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {!formData.has_reservation ? (
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : formData.order_data_confirmed && formData.shipping_data_processed ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  ステータス: <strong>{calculateDataProcessingStatus()}</strong>
                </p>
                {!formData.has_reservation ? (
                  <p className="text-xs text-gray-600 mt-1">
                    予約受注商品が含まれていないため、データ処理は不要です。
                  </p>
                ) : formData.order_data_confirmed && formData.shipping_data_processed ? (
                  <p className="text-xs text-green-600 mt-1">
                    すべての処理が完了しています。
                  </p>
                ) : (
                  <p className="text-xs text-blue-600 mt-1">
                    {!formData.order_data_confirmed && !formData.shipping_data_processed && "受注データ確認と送り状データ処理が必要です。"}
                    {formData.order_data_confirmed && !formData.shipping_data_processed && "送り状データ処理が必要です。"}
                    {!formData.order_data_confirmed && formData.shipping_data_processed && "受注データ確認が必要です。"}
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
                packageId={createdPackageId!}
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