import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      packages: {
        Row: {
          id: string
          package_number: string
          shipper_name: string
          shipping_date: string
          estimated_arrival_date: string
          delivery_status: string
          data_processing_status: string
          remarks: string | null
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          package_number: string
          shipper_name: string
          shipping_date: string
          estimated_arrival_date: string
          delivery_status: string
          data_processing_status: string
          remarks?: string | null
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          package_number?: string
          shipper_name?: string
          shipping_date?: string
          estimated_arrival_date?: string
          delivery_status?: string
          data_processing_status?: string
          remarks?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      package_files: {
        Row: {
          id: string
          package_id: string
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          created_at: string
          uploaded_by: string
        }
        Insert: {
          id?: string
          package_id: string
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          created_at?: string
          uploaded_by: string
        }
        Update: {
          id?: string
          package_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          created_at?: string
          uploaded_by?: string
        }
      }
      package_status_history: {
        Row: {
          id: string
          package_id: string
          field_name: string
          old_value: string | null
          new_value: string | null
          changed_at: string
          changed_by: string
          reason: string | null
        }
        Insert: {
          id?: string
          package_id: string
          field_name: string
          old_value?: string | null
          new_value?: string | null
          changed_at?: string
          changed_by: string
          reason?: string | null
        }
        Update: {
          id?: string
          package_id?: string
          field_name?: string
          old_value?: string | null
          new_value?: string | null
          changed_at?: string
          changed_by?: string
          reason?: string | null
        }
      }
    }
  }
}

export const DELIVERY_STATUSES = [
  '輸送中（航空便）',
  '輸送中（船便）',
  '国内陸送中',
  '到着（未確認）',
  '処理済み'
] as const

export const DATA_PROCESSING_STATUSES = [
  '送り状データ処理済み',
  '受注データ確認済み',
  '予約無し'
] as const

export type DeliveryStatus = typeof DELIVERY_STATUSES[number]
export type DataProcessingStatus = typeof DATA_PROCESSING_STATUSES[number]

// 複数選択可能なデータ処理ステータス
export type DataProcessingStatusArray = DataProcessingStatus[]