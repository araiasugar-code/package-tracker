'use client'

import { useState } from 'react'

const SQL_SCHEMA = `-- Create packages table
CREATE TABLE packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_number TEXT UNIQUE NOT NULL,
    shipper_name TEXT NOT NULL,
    shipping_date DATE NOT NULL,
    estimated_arrival_date DATE NOT NULL,
    delivery_status TEXT NOT NULL CHECK (delivery_status IN ('輸送中（航空便）', '輸送中（船便）', '国内陸送中', '到着（未確認）', '処理済み')),
    data_processing_status TEXT NOT NULL CHECK (data_processing_status IN ('送り状データ処理済み', '受注データ確認済み', '予約無し')),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Create package_files table
CREATE TABLE package_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Create package_status_history table
CREATE TABLE package_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE NOT NULL,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    changed_by UUID REFERENCES auth.users(id) NOT NULL,
    reason TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_packages_package_number ON packages(package_number);
CREATE INDEX idx_packages_shipping_date ON packages(shipping_date);
CREATE INDEX idx_packages_delivery_status ON packages(delivery_status);
CREATE INDEX idx_packages_data_processing_status ON packages(data_processing_status);
CREATE INDEX idx_package_files_package_id ON package_files(package_id);
CREATE INDEX idx_package_status_history_package_id ON package_status_history(package_id);

-- Create trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_status_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (all users can read/write all data for team usage)
CREATE POLICY "Enable all operations for authenticated users" ON packages
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable all operations for authenticated users" ON package_files
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable all operations for authenticated users" ON package_status_history
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('package-files', 'package-files', false);

-- Create storage policy
CREATE POLICY "Authenticated users can upload files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'package-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view files" ON storage.objects
    FOR SELECT USING (bucket_id = 'package-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete files" ON storage.objects
    FOR DELETE USING (bucket_id = 'package-files' AND auth.role() = 'authenticated');`

export default function SetupRequired() {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('コピーに失敗しました:', err)
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            荷物管理システム
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            セットアップが必要です
          </p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Supabase設定が必要です
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>アプリケーションを使用するには、以下の設定を完了してください：</p>
                <ol className="mt-2 list-decimal list-inside space-y-1">
                  <li>Supabaseプロジェクトを作成</li>
                  <li>データベーススキーマをセットアップ</li>
                  <li>.env.localファイルに認証情報を設定</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">📋 5分で完了！セットアップ手順</h3>
          
          <div className="space-y-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-gray-800 flex items-center">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">1</span>
                Supabaseアカウント作成（1分）
              </h4>
              <div className="mt-2 space-y-2">
                <p className="text-sm text-gray-600">
                  ① <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" 
                     className="text-indigo-600 hover:text-indigo-500 underline font-medium">
                    supabase.com
                  </a> にアクセス
                </p>
                <p className="text-sm text-gray-600">② 「Start your project」をクリック</p>
                <p className="text-sm text-gray-600">③ GitHubアカウントでサインアップ</p>
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-gray-800 flex items-center">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">2</span>
                新プロジェクト作成（1分）
              </h4>
              <div className="mt-2 space-y-2">
                <p className="text-sm text-gray-600">① 「+ New project」をクリック</p>
                <p className="text-sm text-gray-600">② プロジェクト名：<code className="bg-gray-100 px-1 rounded">package-tracker</code></p>
                <p className="text-sm text-gray-600">③ パスワード設定して「Create new project」</p>
              </div>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-semibold text-gray-800 flex items-center">
                <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">3</span>
                データベース設定（1分）
              </h4>
              <div className="mt-2 space-y-3">
                <p className="text-sm text-gray-600">① 左メニューの「SQL Editor」をクリック</p>
                
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-800">② SQLをコピー：</p>
                    <button
                      onClick={() => copyToClipboard(SQL_SCHEMA)}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                        copied 
                          ? 'bg-green-500 text-white' 
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {copied ? '✓ コピー完了' : '📋 SQLをコピー'}
                    </button>
                  </div>
                  
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-blue-700 hover:text-blue-800 select-none">
                      🔍 SQLの内容を表示（クリックして展開）
                    </summary>
                    <div className="mt-2 bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto max-h-48 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{SQL_SCHEMA}</pre>
                    </div>
                  </details>
                </div>

                <p className="text-sm text-gray-600">③ Supabase SQL Editorにペーストして「Run」をクリック</p>
                
                <div className="bg-green-50 p-2 rounded text-xs text-green-700">
                  ✅ 成功すると「Success. No rows returned」と表示されます
                </div>
              </div>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-semibold text-gray-800 flex items-center">
                <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">4</span>
                認証情報コピー（1分）
              </h4>
              <div className="mt-2 space-y-2">
                <p className="text-sm text-gray-600">① 左メニューの「Settings」→「API」をクリック</p>
                <p className="text-sm text-gray-600">② 「Project URL」をコピー</p>
                <p className="text-sm text-gray-600">③ 「anon public」キーをコピー</p>
              </div>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-semibold text-gray-800 flex items-center">
                <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">5</span>
                環境変数設定（1分）
              </h4>
              <div className="mt-2 space-y-2">
                <p className="text-sm text-gray-600 mb-2">VSCodeで <code className="bg-gray-100 px-1 rounded">.env.local</code> を開いて編集：</p>
                <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono">
                  <div className="text-gray-400"># コピーした値に置き換え</div>
                  <div>NEXT_PUBLIC_SUPABASE_URL=<span className="text-yellow-300">あなたのProject URL</span></div>
                  <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=<span className="text-yellow-300">あなたのanon public key</span></div>
                </div>
                <div className="bg-blue-50 p-2 rounded text-xs text-blue-700 mt-2">
                  ⚠️ 必ず実際の値に置き換えてください！placeholder値のままでは動作しません
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h4 className="font-semibold text-green-800 flex items-center">
                🚀 完了！サーバー再起動
              </h4>
              <p className="text-sm text-green-700 mt-1">
                ファイル保存後、このページを <strong>リロード(F5)</strong> してください。
              </p>
              <p className="text-xs text-green-600 mt-1">
                自動的にログイン画面が表示されます
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h4 className="font-semibold text-yellow-800 flex items-center">
                👤 初回ログイン用ユーザー作成
              </h4>
              <div className="mt-2 space-y-2 text-sm text-yellow-700">
                <p>ログイン画面が表示されたら、以下の手順でユーザーを作成：</p>
                <p>① Supabaseダッシュボードの「Authentication」→「Users」</p>
                <p>② 「Add user」でメールアドレス・パスワードを設定</p>
                <p>③ 作成したアカウントでアプリにログイン</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            詳細なセットアップ手順は
            <a href="/README.md" target="_blank" className="text-indigo-600 hover:text-indigo-500 underline ml-1">
              README.md
            </a>
            をご確認ください。
          </p>
        </div>
      </div>
    </div>
  )
}