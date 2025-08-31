'use client'

import { useState, useEffect } from 'react'
import { Package, PackageFile, PackageStatusHistory } from '@/types/package'
import { packageService } from '@/lib/packageService'
import { fileService } from '@/lib/fileService'
import { useAuth } from './AuthProvider'
import PackageForm from './PackageForm'
import PackageDetail from './PackageDetail'
import SearchFilter, { FilterOptions } from './SearchFilter'
import FileListViewer from './FileListViewer'
import StatusHistoryModal from './StatusHistoryModal'
import StatusSummary from './StatusSummary'

type SortField = 'created_at' | 'shipping_date' | 'estimated_arrival_date'
type SortOrder = 'asc' | 'desc'

export default function PackageList() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [packageFiles, setPackageFiles] = useState<{[key: string]: PackageFile[]}>({})
  const [packageHistory, setPackageHistory] = useState<{[key: string]: PackageStatusHistory[]}>({})
  // const [expandedHistory, setExpandedHistory] = useState<{[key: string]: boolean}>({}) // 未使用のためコメントアウト
  const [showFileViewer, setShowFileViewer] = useState(false)
  const [selectedPackageFiles, setSelectedPackageFiles] = useState<{packageId: string, files: PackageFile[]}>({packageId: '', files: []})
  const [showStatusHistory, setShowStatusHistory] = useState(false)
  const [selectedPackageHistory, setSelectedPackageHistory] = useState<{packageId: string, packageNumber: string, history: PackageStatusHistory[]}>({packageId: '', packageNumber: '', history: []})
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const { user, signOut } = useAuth()

  useEffect(() => {
    loadPackages()
  }, [])

  const loadPackages = async () => {
    try {
      setLoading(true)
      const data = await packageService.getAllPackages()
      setPackages(data)
      
      // 各荷物のファイル情報と履歴を並列で取得
      const filesMap: {[key: string]: PackageFile[]} = {}
      const historyMap: {[key: string]: PackageStatusHistory[]} = {}
      
      await Promise.all(data.map(async (pkg) => {
        try {
          const [files, history] = await Promise.all([
            fileService.getPackageFiles(pkg.id),
            packageService.getPackageHistory(pkg.id)
          ])
          filesMap[pkg.id] = files
          historyMap[pkg.id] = history
        } catch (err) {
          console.error(`Failed to load data for package ${pkg.id}:`, err)
          filesMap[pkg.id] = []
          historyMap[pkg.id] = []
        }
      }))
      
      setPackageFiles(filesMap)
      setPackageHistory(historyMap)
    } catch (err) {
      setError('荷物データの読み込みに失敗しました')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = async (filters: FilterOptions) => {
    try {
      setLoading(true)
      let data: Package[]

      if (filters.searchQuery) {
        data = await packageService.searchPackages(filters.searchQuery)
      } else if (Object.keys(filters).some(key => key !== 'searchQuery' && filters[key as keyof FilterOptions])) {
        data = await packageService.filterPackages({
          delivery_status: filters.delivery_status,
          data_processing_status: filters.data_processing_status,
          shipping_date_from: filters.shipping_date_from,
          shipping_date_to: filters.shipping_date_to,
          estimated_arrival_date_from: filters.estimated_arrival_date_from,
          estimated_arrival_date_to: filters.estimated_arrival_date_to
        })
      } else {
        data = await packageService.getAllPackages()
      }
      
      setPackages(data)
    } catch (err) {
      setError('検索に失敗しました')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleClearFilters = () => {
    loadPackages()
  }

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg)
    setShowForm(true)
  }

  const handleDelete = async (pkg: Package) => {
    if (!confirm(`荷物「${pkg.package_number}」を削除しますか？`)) {
      return
    }

    try {
      await packageService.deletePackage(pkg.id)
      loadPackages()
    } catch (err) {
      setError('削除に失敗しました')
      console.error(err)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingPackage(null)
  }

  const handleFormSuccess = () => {
    loadPackages()
  }

  const handleViewDetail = (packageId: string) => {
    setSelectedPackageId(packageId)
    setShowDetail(true)
  }

  const handleDetailClose = () => {
    setShowDetail(false)
    setSelectedPackageId(null)
  }

  const handleViewFiles = (packageId: string) => {
    const files = packageFiles[packageId] || []
    setSelectedPackageFiles({ packageId, files })
    setShowFileViewer(true)
  }

  const handleFileViewerClose = () => {
    setShowFileViewer(false)
    setSelectedPackageFiles({packageId: '', files: []})
  }

  const handleViewHistory = (packageId: string, packageNumber: string) => {
    const history = packageHistory[packageId] || []
    setSelectedPackageHistory({ packageId, packageNumber, history })
    setShowStatusHistory(true)
  }

  const handleStatusHistoryClose = () => {
    setShowStatusHistory(false)
    setSelectedPackageHistory({packageId: '', packageNumber: '', history: []})
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
      '予約無し': 'bg-gray-100 text-gray-800',
      '処理待ち': 'bg-red-100 text-red-800',
      '受注データ確認済み': 'bg-yellow-100 text-yellow-800',
      '送り状データ処理済み': 'bg-blue-100 text-blue-800',
      '処理完了': 'bg-green-100 text-green-800'
    }

    return deliveryColors[status] || dataColors[status] || 'bg-gray-100 text-gray-800'
  }

  // ソート機能
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const getSortedPackages = (packageList: Package[]) => {
    return [...packageList].sort((a, b) => {
      let aValue: string | Date
      let bValue: string | Date

      switch (sortField) {
        case 'created_at':
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        case 'shipping_date':
          aValue = new Date(a.shipping_date)
          bValue = new Date(b.shipping_date)
          break
        case 'estimated_arrival_date':
          aValue = new Date(a.estimated_arrival_date)
          bValue = new Date(b.estimated_arrival_date)
          break
        default:
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
      }

      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1
      }
      return 0
    })
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }

    if (sortOrder === 'asc') {
      return (
        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
      )
    }

    return (
      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    )
  }

  // 処理済みとそれ以外に分けてソート
  const activePackages = getSortedPackages(packages.filter(pkg => pkg.delivery_status !== '処理済み'))
  const completedPackages = getSortedPackages(packages.filter(pkg => pkg.delivery_status === '処理済み'))

  // データ処理ステータスの表示処理 (新しいフラグベース)
  const renderDataProcessingStatus = (pkg: Package) => {
    // 後方互換性: 古いデータの場合はdata_processing_statusを使用
    const hasReservation = pkg.has_reservation ?? (pkg.data_processing_status !== '予約無し')
    const orderConfirmed = pkg.order_data_confirmed ?? (pkg.data_processing_status === '受注データ確認済み' || pkg.data_processing_status === '処理完了')
    const shippingProcessed = pkg.shipping_data_processed ?? (pkg.data_processing_status === '送り状データ処理済み' || pkg.data_processing_status === '処理完了')
    
    // 予約なしの場合
    if (!hasReservation) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          予約無し
        </span>
      )
    }

    // 予約ありの場合は詳細表示
    return (
      <div className="space-y-1">
        <div className="flex space-x-1 text-xs">
          <span className={`px-1 py-0.5 rounded text-xs font-medium ${
            orderConfirmed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
            受注{orderConfirmed ? '✓' : '○'}
          </span>
          <span className={`px-1 py-0.5 rounded text-xs font-medium ${
            shippingProcessed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
            送り状{shippingProcessed ? '✓' : '○'}
          </span>
        </div>
        {/* 全体ステータス */}
        <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          orderConfirmed && shippingProcessed
            ? 'bg-green-100 text-green-800'
            : orderConfirmed || shippingProcessed
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {orderConfirmed && shippingProcessed ? '処理完了' : 
           orderConfirmed || shippingProcessed ? '一部完了' : '処理待ち'}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">荷物管理システム</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                ログイン中: {user?.user_metadata?.full_name || user?.email}
              </span>
              <button
                onClick={() => signOut()}
                className="text-sm text-red-600 hover:text-red-800"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Status Summary */}
          <StatusSummary packages={packages} />
        </div>

        {/* Search and Actions */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">荷物管理</h2>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              新規追加
            </button>
          </div>

          <SearchFilter
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Active Packages Table */}
        <div className="px-4 sm:px-0 space-y-8">
          {/* 進行中の荷物 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              進行中の荷物 ({activePackages.length}件)
            </h3>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              {activePackages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">進行中の荷物がありません</p>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      荷物番号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      発送元
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('shipping_date')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>発送日</span>
                        {getSortIcon('shipping_date')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('estimated_arrival_date')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>到着予定日</span>
                        {getSortIcon('estimated_arrival_date')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      配送ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      データ処理ステータス
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>登録日時</span>
                        {getSortIcon('created_at')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ファイル
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      履歴
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activePackages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <button
                          onClick={() => handleViewDetail(pkg.id)}
                          className="text-indigo-600 hover:text-indigo-900 hover:underline"
                        >
                          {pkg.package_number}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pkg.shipper_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(pkg.shipping_date).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(pkg.estimated_arrival_date).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pkg.delivery_status)}`}>
                          {pkg.delivery_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderDataProcessingStatus(pkg)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(pkg.created_at).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })} {new Date(pkg.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {packageFiles[pkg.id] && packageFiles[pkg.id].length > 0 ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-blue-600 font-medium">{packageFiles[pkg.id].length}件</span>
                            <button 
                              onClick={() => handleViewFiles(pkg.id)}
                              className="text-indigo-600 hover:text-indigo-900 text-xs"
                            >
                              閲覧
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">なし</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {packageHistory[pkg.id] && packageHistory[pkg.id].length > 0 ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-purple-600 font-medium">{packageHistory[pkg.id].length}件</span>
                            <button 
                              onClick={() => handleViewHistory(pkg.id, pkg.package_number)}
                              className="text-indigo-600 hover:text-indigo-900 text-xs"
                            >
                              表示
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">なし</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleEdit(pkg)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          編集
                        </button>
                        <button 
                          onClick={() => handleDelete(pkg)}
                          className="text-red-600 hover:text-red-900"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              )}
            </div>
          </div>

          {/* 処理済み荷物 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              処理完了済み荷物 ({completedPackages.length}件)
            </h3>
            <div className="bg-gray-50 shadow overflow-hidden sm:rounded-md border-2 border-green-200">
              {completedPackages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">処理完了済みの荷物がありません</p>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-green-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      荷物番号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      発送元
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-green-100 select-none"
                      onClick={() => handleSort('shipping_date')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>発送日</span>
                        {getSortIcon('shipping_date')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-green-100 select-none"
                      onClick={() => handleSort('estimated_arrival_date')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>到着予定日</span>
                        {getSortIcon('estimated_arrival_date')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      データ処理ステータス
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-green-100 select-none"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>登録日時</span>
                        {getSortIcon('created_at')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ファイル
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      履歴
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {completedPackages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-gray-50 opacity-80">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <button
                          onClick={() => handleViewDetail(pkg.id)}
                          className="text-indigo-600 hover:text-indigo-900 hover:underline"
                        >
                          {pkg.package_number}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pkg.shipper_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(pkg.shipping_date).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(pkg.estimated_arrival_date).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderDataProcessingStatus(pkg)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(pkg.created_at).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })} {new Date(pkg.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {packageFiles[pkg.id] && packageFiles[pkg.id].length > 0 ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-blue-600 font-medium">{packageFiles[pkg.id].length}件</span>
                            <button 
                              onClick={() => handleViewFiles(pkg.id)}
                              className="text-indigo-600 hover:text-indigo-900 text-xs"
                            >
                              閲覧
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">なし</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {packageHistory[pkg.id] && packageHistory[pkg.id].length > 0 ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-purple-600 font-medium">{packageHistory[pkg.id].length}件</span>
                            <button 
                              onClick={() => handleViewHistory(pkg.id, pkg.package_number)}
                              className="text-indigo-600 hover:text-indigo-900 text-xs"
                            >
                              表示
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">なし</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleEdit(pkg)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          編集
                        </button>
                        <button 
                          onClick={() => handleDelete(pkg)}
                          className="text-red-600 hover:text-red-900"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              © 2025 Package Management System
            </div>
            <div className="text-sm text-gray-500">
              Developed by <span className="font-medium text-gray-700">Akihiro Arai</span> - {new Date().toLocaleDateString('ja-JP')}
            </div>
          </div>
        </div>
      </footer>

      {/* Package Form Modal */}
      {showForm && (
        <PackageForm
          package={editingPackage || undefined}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Package Detail Modal */}
      {showDetail && selectedPackageId && (
        <PackageDetail
          packageId={selectedPackageId}
          onClose={handleDetailClose}
        />
      )}

      {/* File List Viewer Modal */}
      {showFileViewer && (
        <FileListViewer
          packageId={selectedPackageFiles.packageId}
          files={selectedPackageFiles.files}
          onClose={handleFileViewerClose}
        />
      )}

      {/* Status History Modal */}
      {showStatusHistory && (
        <StatusHistoryModal
          packageId={selectedPackageHistory.packageId}
          packageNumber={selectedPackageHistory.packageNumber}
          history={selectedPackageHistory.history}
          onClose={handleStatusHistoryClose}
        />
      )}
    </div>
  )
}