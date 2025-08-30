import { createClient } from './auth'
import { PackageFile } from '@/types/package'

export class FileService {
  private supabase = createClient()

  async uploadFile(packageId: string, file: File, userId: string): Promise<PackageFile> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${packageId}/${fileName}`

    const { error: uploadError } = await this.supabase.storage
      .from('package-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    const fileRecord = {
      package_id: packageId,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: userId
    }

    const { data, error } = await this.supabase
      .from('package_files')
      .insert(fileRecord)
      .select()
      .single()

    if (error) {
      await this.supabase.storage
        .from('package-files')
        .remove([filePath])
      throw error
    }

    return data
  }

  async getPackageFiles(packageId: string): Promise<PackageFile[]> {
    const { data, error } = await this.supabase
      .from('package_files')
      .select('*')
      .eq('package_id', packageId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async deleteFile(fileId: string): Promise<void> {
    const { data: fileRecord, error: fetchError } = await this.supabase
      .from('package_files')
      .select('file_path')
      .eq('id', fileId)
      .single()

    if (fetchError) throw fetchError

    const { error: storageError } = await this.supabase.storage
      .from('package-files')
      .remove([fileRecord.file_path])

    if (storageError) throw storageError

    const { error: dbError } = await this.supabase
      .from('package_files')
      .delete()
      .eq('id', fileId)

    if (dbError) throw dbError
  }

  async getFileUrl(filePath: string): Promise<string> {
    const { data } = await this.supabase.storage
      .from('package-files')
      .createSignedUrl(filePath, 3600)

    if (data?.signedUrl) {
      return data.signedUrl
    }

    throw new Error('ファイルURLの取得に失敗しました')
  }

  async downloadFile(filePath: string): Promise<Blob> {
    const { data, error } = await this.supabase.storage
      .from('package-files')
      .download(filePath)

    if (error) throw error
    if (!data) throw new Error('ファイルが見つかりません')

    return data
  }

  isValidFileType(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    return allowedTypes.includes(file.type)
  }

  isValidFileSize(file: File): boolean {
    const maxSize = 10 * 1024 * 1024
    return file.size <= maxSize
  }
}

export const fileService = new FileService()