-- データ処理ステータスを独立したフラグに変更

-- 新しい列を追加
ALTER TABLE packages ADD COLUMN has_reservation BOOLEAN DEFAULT true;
ALTER TABLE packages ADD COLUMN order_data_confirmed BOOLEAN DEFAULT false;
ALTER TABLE packages ADD COLUMN shipping_data_processed BOOLEAN DEFAULT false;

-- 既存データの migration
-- 既存の data_processing_status から新しいフラグに変換
UPDATE packages SET 
    has_reservation = CASE 
        WHEN data_processing_status = '予約無し' THEN false 
        ELSE true 
    END,
    order_data_confirmed = CASE 
        WHEN data_processing_status IN ('受注データ確認済み', '処理完了') THEN true 
        ELSE false 
    END,
    shipping_data_processed = CASE 
        WHEN data_processing_status IN ('送り状データ処理済み', '処理完了') THEN true 
        ELSE false 
    END;

-- 古い制約を削除
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_data_processing_status_check;

-- data_processing_status列は後方互換性のため保持（ビューとして計算）