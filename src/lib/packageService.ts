import { createClient } from './auth'
import { Package, PackageInsert, PackageUpdate, PackageStatusHistory } from '@/types/package'

export class PackageService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private supabase = createClient() as any

  async getAllPackages(): Promise<Package[]> {
    const { data, error } = await this.supabase
      .from('packages')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getPackageById(id: string): Promise<Package | null> {
    const { data, error } = await this.supabase
      .from('packages')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  }

  async createPackage(packageData: PackageInsert): Promise<Package> {
    const { data, error } = await this.supabase
      .from('packages')
      .insert(packageData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updatePackage(id: string, updates: PackageUpdate, userId: string, reason?: string): Promise<Package> {
    const currentPackage = await this.getPackageById(id)
    if (!currentPackage) throw new Error('Package not found')

    // updated_at を追加
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await this.supabase
      .from('packages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      throw error
    }

    // 履歴記録
    for (const [key, newValue] of Object.entries(updates)) {
      if (newValue !== undefined && newValue !== null) {
        const oldValue = currentPackage[key as keyof Package] as string
        if (oldValue !== newValue) {
          await this.createStatusHistory({
            package_id: id,
            field_name: key,
            old_value: oldValue,
            new_value: String(newValue),
            changed_by: userId,
            reason
          })
        }
      }
    }

    return data
  }

  async deletePackage(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('packages')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async searchPackages(query: string): Promise<Package[]> {
    const { data, error } = await this.supabase
      .from('packages')
      .select('*')
      .or(`package_number.ilike.%${query}%,shipper_name.ilike.%${query}%,remarks.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async filterPackages(filters: {
    delivery_status?: string
    data_processing_status?: string
    shipping_date_from?: string
    shipping_date_to?: string
    estimated_arrival_date_from?: string
    estimated_arrival_date_to?: string
  }): Promise<Package[]> {
    let query = this.supabase.from('packages').select('*')

    if (filters.delivery_status) {
      query = query.eq('delivery_status', filters.delivery_status)
    }
    if (filters.data_processing_status) {
      query = query.eq('data_processing_status', filters.data_processing_status)
    }
    if (filters.shipping_date_from) {
      query = query.gte('shipping_date', filters.shipping_date_from)
    }
    if (filters.shipping_date_to) {
      query = query.lte('shipping_date', filters.shipping_date_to)
    }
    if (filters.estimated_arrival_date_from) {
      query = query.gte('estimated_arrival_date', filters.estimated_arrival_date_from)
    }
    if (filters.estimated_arrival_date_to) {
      query = query.lte('estimated_arrival_date', filters.estimated_arrival_date_to)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getPackageHistory(packageId: string): Promise<PackageStatusHistory[]> {
    const { data, error } = await this.supabase
      .from('package_status_history')
      .select('*')
      .eq('package_id', packageId)
      .order('changed_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  private async createStatusHistory(historyData: {
    package_id: string
    field_name: string
    old_value: string | null
    new_value: string | null
    changed_by: string
    reason?: string | null
  }): Promise<void> {
    const { error } = await this.supabase
      .from('package_status_history')
      .insert(historyData)

    if (error) throw error
  }
}

export const packageService = new PackageService()