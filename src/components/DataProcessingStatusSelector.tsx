'use client'

import { DATA_PROCESSING_STATUSES, DataProcessingStatus } from '@/lib/supabase'

interface DataProcessingStatusSelectorProps {
  selectedStatuses: DataProcessingStatus[]
  onChange: (statuses: DataProcessingStatus[]) => void
  disabled?: boolean
}

export default function DataProcessingStatusSelector({ 
  selectedStatuses, 
  onChange, 
  disabled = false 
}: DataProcessingStatusSelectorProps) {
  const handleStatusChange = (status: DataProcessingStatus, checked: boolean) => {
    if (status === '予約無し') {
      // 「予約無し」が選択された場合、他のステータスを全て解除
      if (checked) {
        onChange(['予約無し'])
      } else {
        onChange([])
      }
    } else {
      // 他のステータスが選択された場合
      let newStatuses = [...selectedStatuses]
      
      if (checked) {
        // 「予約無し」があれば削除
        newStatuses = newStatuses.filter(s => s !== '予約無し')
        // 新しいステータスを追加
        if (!newStatuses.includes(status)) {
          newStatuses.push(status)
        }
      } else {
        // ステータスを削除
        newStatuses = newStatuses.filter(s => s !== status)
      }
      
      onChange(newStatuses)
    }
  }

  const isNoReservation = selectedStatuses.includes('予約無し')

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        データ処理ステータス *
      </label>
      
      <div className="space-y-2">
        {DATA_PROCESSING_STATUSES.map((status) => {
          const isChecked = selectedStatuses.includes(status)
          const isDisabled = disabled || (status !== '予約無し' && isNoReservation) || (status === '予約無し' && selectedStatuses.length > 0 && !isNoReservation)
          
          return (
            <label key={status} className={`flex items-center space-x-3 ${isDisabled ? 'opacity-50' : ''}`}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => handleStatusChange(status, e.target.checked)}
                disabled={isDisabled}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
              />
              <span className="text-sm text-gray-900">{status}</span>
            </label>
          )
        })}
      </div>
      
      {/* 説明文 */}
      <div className={`mt-3 p-3 rounded-md border ${
        isNoReservation 
          ? 'bg-yellow-50 border-yellow-200' 
          : selectedStatuses.length > 0
            ? 'bg-blue-50 border-blue-200'
            : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex">
          <div className="flex-shrink-0">
            {isNoReservation ? (
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : selectedStatuses.length > 0 ? (
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="ml-3">
            {isNoReservation ? (
              <p className="text-sm text-yellow-700">
                「予約無し」を選択した場合、追加のデータ処理は不要です。
              </p>
            ) : selectedStatuses.length > 0 ? (
              <p className="text-sm text-blue-700">
                <strong>{selectedStatuses.join('・')}</strong>が選択されています。
                {selectedStatuses.length === 2 && '両方のデータ処理が完了している状態です。'}
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                必要なデータ処理ステータスを選択してください。「送り状データ処理済み」と「受注データ確認済み」の両方を選択することも可能です。
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}