-- データ処理ステータスの制約を更新
-- 既存の制約を削除
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_data_processing_status_check;

-- 新しい制約を追加
ALTER TABLE packages ADD CONSTRAINT packages_data_processing_status_check 
    CHECK (data_processing_status IN ('予約無し', '処理待ち', '受注データ確認済み', '送り状データ処理済み', '処理完了'));