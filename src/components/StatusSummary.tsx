'use client'

import { Package } from '@/types/package'
import { DELIVERY_STATUSES, DeliveryStatus } from '@/lib/supabase'

interface StatusSummaryProps {
  packages: Package[]
}

export default function StatusSummary({ packages }: StatusSummaryProps) {
  const getStatusCounts = () => {
    const counts: { [key: string]: number } = {
      '輸送中（航空便）': 0,
      '輸送中（船便）': 0,
      '国内陸送中': 0,
      '到着（未確認）': 0
    }

    packages.filter(pkg => pkg.delivery_status !== '処理済み').forEach(pkg => {
      counts[pkg.delivery_status as DeliveryStatus]++
    })

    return counts
  }

  const getStatusColor = (status: DeliveryStatus) => {
    const colors: { [key in DeliveryStatus]: string } = {
      '輸送中（航空便）': 'bg-blue-100 text-blue-800 border-blue-200',
      '輸送中（船便）': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      '国内陸送中': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      '到着（未確認）': 'bg-orange-100 text-orange-800 border-orange-200',
      '処理済み': 'bg-green-100 text-green-800 border-green-200'
    }
    return colors[status]
  }

  const statusCounts = getStatusCounts()
  const activePackagesCount = packages.filter(pkg => pkg.delivery_status !== '処理済み').length

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">配送ステータス別件数</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {DELIVERY_STATUSES.filter(status => status !== '処理済み').map((status) => (
          <div 
            key={status}
            className={`border rounded-lg p-4 text-center ${getStatusColor(status)}`}
          >
            <div className="text-2xl font-bold mb-1">
              {statusCounts[status]}
            </div>
            <div className="text-sm font-medium">
              {status}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">進行中の合計件数</span>
          <span className="text-lg font-semibold text-gray-900">{activePackagesCount}件</span>
        </div>
      </div>
    </div>
  )
}