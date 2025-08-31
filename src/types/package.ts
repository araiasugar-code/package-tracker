import { DeliveryStatus, DataProcessingStatus } from '@/lib/supabase'

export interface Package {
  id: string
  package_number: string
  shipper_name: string
  shipping_date: string
  estimated_arrival_date: string
  delivery_status: DeliveryStatus
  data_processing_status: DataProcessingStatus
  has_reservation: boolean
  order_data_confirmed: boolean
  shipping_data_processed: boolean
  remarks: string | null
  created_at: string
  updated_at: string
  created_by: string
}

export interface PackageInsert {
  package_number: string
  shipper_name: string
  shipping_date: string
  estimated_arrival_date: string
  delivery_status: DeliveryStatus
  data_processing_status: DataProcessingStatus
  has_reservation: boolean
  order_data_confirmed: boolean
  shipping_data_processed: boolean
  remarks?: string | null
  created_by: string
}

export interface PackageUpdate {
  package_number?: string
  shipper_name?: string
  shipping_date?: string
  estimated_arrival_date?: string
  delivery_status?: DeliveryStatus
  data_processing_status?: DataProcessingStatus
  has_reservation?: boolean
  order_data_confirmed?: boolean
  shipping_data_processed?: boolean
  remarks?: string | null
}

export interface PackageFile {
  id: string
  package_id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  created_at: string
  uploaded_by: string
}

export interface PackageStatusHistory {
  id: string
  package_id: string
  field_name: string
  old_value: string | null
  new_value: string | null
  changed_at: string
  changed_by: string
  reason: string | null
  changed_by_user?: {
    email: string
  }
}