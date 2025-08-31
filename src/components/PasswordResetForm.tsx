'use client'

import { useState } from 'react'
import { createClient } from '@/lib/auth'

interface PasswordResetFormProps {
  onClose: () => void
  onSuccess: () => void
  onSwitchToSignIn: () => void
}

export default function PasswordResetForm({ onClose, onSuccess, onSwitchToSignIn }: PasswordResetFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('メールアドレスを入力してください')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const redirectUrl = 'https://package-tracker-taupe.vercel.app/auth/reset-password'
        
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'パスワードリセットメールの送信に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              メールを送信しました
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {email} にパスワードリセット用のメールを送信しました。
              メール内のリンクをクリックして新しいパスワードを設定してください。
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-xs text-gray-500 mt-2">自動的にログイン画面に戻ります...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">パスワードリセット</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          登録されているメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="example@email.com"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                送信中...
              </div>
            ) : (
              'リセットメールを送信'
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToSignIn}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              ログイン画面に戻る
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}