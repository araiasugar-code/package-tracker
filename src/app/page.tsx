'use client'

import { useAuth } from '@/components/AuthProvider'
import LoginForm from '@/components/LoginForm'
import PackageList from '@/components/PackageList'
import SetupRequired from '@/components/SetupRequired'

export default function Home() {
  const { user, loading } = useAuth()
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Supabase設定チェック
  if (!supabaseUrl || !supabaseKey || 
      supabaseUrl === 'https://placeholder.supabase.co' || 
      supabaseKey === 'placeholder_key') {
    return <SetupRequired />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return <PackageList />
}
