-- Create packages table
CREATE TABLE packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_number TEXT UNIQUE NOT NULL,
    shipper_name TEXT NOT NULL,
    shipping_date DATE NOT NULL,
    estimated_arrival_date DATE NOT NULL,
    delivery_status TEXT NOT NULL CHECK (delivery_status IN ('輸送中（航空便）', '輸送中（船便）', '国内陸送中', '到着（未確認）', '処理済み')),
    data_processing_status TEXT NOT NULL CHECK (data_processing_status IN ('予約無し', '処理待ち', '受注データ確認済み', '送り状データ処理済み', '処理完了')),
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
    FOR DELETE USING (bucket_id = 'package-files' AND auth.role() = 'authenticated');