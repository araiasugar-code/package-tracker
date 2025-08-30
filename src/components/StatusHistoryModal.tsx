'use client'

import { PackageStatusHistory } from '@/types/package'

interface StatusHistoryModalProps {
  packageId: string
  packageNumber: string
  history: PackageStatusHistory[]
  onClose: () => void
}

export default function StatusHistoryModal({ packageId, packageNumber, history, onClose }: StatusHistoryModalProps) {
  const getFieldLabel = (fieldName: string): string => {
    const labels: { [key: string]: string } = {
      'package_number': '荷物番号',
      'shipper_name': '発送元名',
      'shipping_date': '発送日',
      'estimated_arrival_date': '到着予定日',
      'delivery_status': '配送ステータス',
      'data_processing_status': 'データ処理ステータス',
      'remarks': '備考'
    }
    return labels[fieldName] || fieldName
  }

  const formatValue = (fieldName: string, value: string | null): string => {
    if (value === null) return '(空)'
    
    if (fieldName === 'shipping_date' || fieldName === 'estimated_arrival_date') {
      try {
        return new Date(value).toLocaleDateString('ja-JP')
      } catch {
        return value
      }
    }
    
    return value
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4">
      <div className="relative bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            ステータス変更履歴 - {packageNumber}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">変更履歴はありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item, index) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {getFieldLabel(item.field_name)}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        #{history.length - index}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <div>{new Date(item.changed_at).toLocaleString('ja-JP')}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        操作者: {item.changed_by_user?.email || `ID: ${item.changed_by.substring(0, 8)}...`}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">変更前</div>
                    <div className="bg-red-50 border border-red-200 p-2 rounded text-sm">
                      {formatValue(item.field_name, item.old_value)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">変更後</div>
                    <div className="bg-green-50 border border-green-200 p-2 rounded text-sm">
                      {formatValue(item.field_name, item.new_value)}
                    </div>
                  </div>
                </div>

                {item.reason && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">変更理由</div>
                    <div className="bg-blue-50 border border-blue-200 p-2 rounded text-sm">
                      {item.reason}
                    </div>
                  </div>
                )}
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