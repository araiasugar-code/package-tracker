'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import SignUpForm from './SignUpForm'
import PasswordResetForm from './PasswordResetForm'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSignUp, setShowSignUp] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)
    
    if (error) {
      if (error.message?.includes('Invalid login credentials') || error.message?.includes('Email not confirmed')) {
        setError('ログインに失敗しました。メールアドレスとパスワードを確認するか、アカウント作成後のメール認証を完了してください。')
      } else {
        setError('ログインに失敗しました。メールアドレスとパスワードを確認してください。')
      }
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            荷物管理システム
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            ログインしてください
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowPasswordReset(true)}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              パスワードを忘れた場合
            </button>
            <button
              type="button"
              onClick={() => setShowSignUp(true)}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              新規アカウント作成
            </button>
          </div>
        </form>

        {showSignUp && (
          <SignUpForm
            onClose={() => setShowSignUp(false)}
            onSuccess={() => {
              setShowSignUp(false)
              setError('')
            }}
            onSwitchToSignIn={() => setShowSignUp(false)}
          />
        )}

        {showPasswordReset && (
          <PasswordResetForm
            onClose={() => setShowPasswordReset(false)}
            onSuccess={() => {
              setShowPasswordReset(false)
              setError('')
            }}
            onSwitchToSignIn={() => setShowPasswordReset(false)}
          />
        )}
      </div>
    </div>
  )
}