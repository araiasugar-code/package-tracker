'use client'

import { useState } from 'react'
import { DELIVERY_STATUSES, DATA_PROCESSING_STATUSES } from '@/lib/supabase'

export interface FilterOptions {
  searchQuery?: string
  delivery_status?: string
  data_processing_status?: string
  shipping_date_from?: string
  shipping_date_to?: string
  estimated_arrival_date_from?: string
  estimated_arrival_date_to?: string
}

interface SearchFilterProps {
  onFilterChange: (filters: FilterOptions) => void
  onClearFilters: () => void
}

export default function SearchFilter({ onFilterChange, onClearFilters }: SearchFilterProps) {
  const [filters, setFilters] = useState<FilterOptions>({})
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearAllFilters = () => {
    setFilters({})
    onClearFilters()
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '')

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      {/* Basic Search */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="荷物番号、発送元名、備考で検索..."
              value={filters.searchQuery || ''}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {showAdvanced ? '詳細を隠す' : '詳細検索'}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                クリア
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                配送ステータス
              </label>
              <select
                value={filters.delivery_status || ''}
                onChange={(e) => handleFilterChange('delivery_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">すべて</option>
                {DELIVERY_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                データ処理ステータス
              </label>
              <select
                value={filters.data_processing_status || ''}
                onChange={(e) => handleFilterChange('data_processing_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">すべて</option>
                {DATA_PROCESSING_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Date Filters */}
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                発送日（開始）
              </label>
              <input
                type="date"
                value={filters.shipping_date_from || ''}
                onChange={(e) => handleFilterChange('shipping_date_from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                発送日（終了）
              </label>
              <input
                type="date"
                value={filters.shipping_date_to || ''}
                onChange={(e) => handleFilterChange('shipping_date_to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                到着予定日（開始）
              </label>
              <input
                type="date"
                value={filters.estimated_arrival_date_from || ''}
                onChange={(e) => handleFilterChange('estimated_arrival_date_from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                到着予定日（終了）
              </label>
              <input
                type="date"
                value={filters.estimated_arrival_date_to || ''}
                onChange={(e) => handleFilterChange('estimated_arrival_date_to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700">アクティブフィルター:</span>
                {Object.entries(filters).map(([key, value]) => {
                  if (!value) return null
                  
                  let label = key
                  switch (key) {
                    case 'searchQuery':
                      label = `検索: "${value}"`
                      break
                    case 'delivery_status':
                      label = `配送: ${value}`
                      break
                    case 'data_processing_status':
                      label = `処理: ${value}`
                      break
                    case 'shipping_date_from':
                      label = `発送開始: ${value}`
                      break
                    case 'shipping_date_to':
                      label = `発送終了: ${value}`
                      break
                    case 'estimated_arrival_date_from':
                      label = `到着開始: ${value}`
                      break
                    case 'estimated_arrival_date_to':
                      label = `到着終了: ${value}`
                      break
                  }

                  return (
                    <span
                      key={key}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {label}
                      <button
                        onClick={() => handleFilterChange(key as keyof FilterOptions, '')}
                        className="ml-1 text-indigo-600 hover:text-indigo-800"
                      >
                        ×
                      </button>
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}