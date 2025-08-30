import { createBrowserClient } from '@supabase/ssr'
import { Database } from './supabase'

export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || url === 'your_supabase_project_url' || key === 'your_supabase_anon_key') {
    console.warn('Supabase環境変数が設定されていません。実際の値を.env.localに設定してください。')
  }

  return createBrowserClient<Database>(
    url || 'https://placeholder.supabase.co',
    key || 'placeholder_key'
  )
}

export type User = {
  id: string
  email: string
  full_name?: string
}