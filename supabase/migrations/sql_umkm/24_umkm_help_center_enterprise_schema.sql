-- Migration 24: Help & Support Center Schema & Real-Time Ticket System
-- Enables FAQs, categories, support ticket submission, and real-time status updates

CREATE TABLE IF NOT EXISTS public.umkm_help_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    helpful_count INT DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.umkm_help_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_code VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Umum',
    priority VARCHAR(20) NOT NULL DEFAULT 'Sedang',
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Menunggu Balasan',
    admin_response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_umkm_help_faqs_cat ON public.umkm_help_faqs(category);
CREATE INDEX IF NOT EXISTS idx_umkm_help_tickets_user ON public.umkm_help_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_umkm_help_tickets_status ON public.umkm_help_tickets(status);

-- Enable RLS
ALTER TABLE public.umkm_help_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_help_tickets ENABLE ROW LEVEL SECURITY;

-- Allow public read access to FAQs
CREATE POLICY "Public FAQs Read Access" ON public.umkm_help_faqs
    FOR SELECT USING (true);

-- Allow authenticated users to view & insert their support tickets
CREATE POLICY "Users Ticket Access" ON public.umkm_help_tickets
    FOR ALL USING (true) WITH CHECK (true);

-- Add to Realtime Publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'umkm_help_tickets'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_help_tickets;
    END IF;
END $$;

-- Seed Sample Enterprise FAQs
INSERT INTO public.umkm_help_faqs (category, question, answer, tags) VALUES
('Pengenalan', 'Bagaimana cara memulai dengan ZEGA AI Platform?', 'Anda dapat menavigasi ke menu Beranda dan AI Employees untuk mengaktifkan asisten AI pertama Anda. Ikuti panduan wizard interaktif kami.', ARRAY['start', 'wizard', 'pemula']),
('Otomatisasi', 'Bagaimana cara membuat workflow otomatisasi baru?', 'Buka menu Automation di navigasi bisnis, klik tombol "+ Buat Automation", pilih trigger pesanan/stok/pelanggan, lalu pilih aksi balasan atau notifikasi otomatis.', ARRAY['automation', 'trigger', 'workflow']),
('AI Employees', 'Apa bedanya Customer Support Agent dengan Sales Specialist Agent?', 'Customer Support Agent berfokus menjawab pertanyaan seputar produk dan FAQ, sementara Sales Specialist Agent aktif menawarkan promo, upselling, dan mengirim link pembayaran.', ARRAY['ai', 'agents', 'support', 'sales']),
('Billing & Paket', 'Bagaimana cara mengupgrade paket langganan ke Scale/Enterprise?', 'Klik tombol Upgrade di header atas atau navigasi ke Settings > Billing & Invoice. Pilih paket Scale lalu lakukan pembayaran via QRIS/Solana/Credit Card.', ARRAY['billing', 'upgrade', 'payment']),
('API & Integrasi', 'Di mana saya bisa mendapatkan API Key ZEGA?', 'Navigasi ke menu Settings > API Keys, klik "+ Generate API Key Baru", tentukan scope akses dan salin API key rahasia Anda.', ARRAY['api', 'key', 'developer'])
ON CONFLICT DO NOTHING;

-- Seed Initial Demo Ticket
INSERT INTO public.umkm_help_tickets (ticket_code, user_email, user_name, subject, category, priority, message, status) VALUES
('TKT-8842', 'cici.berluk@gmail.com', 'Cicik Berluk', 'Pertanyaan mengenai integrasi WhatsApp API', 'API & Integrasi', 'Tinggi', 'Halo tim ZEGA, bagaimana cara menghubungkan nomor WhatsApp bisnis saya ke AI Employee?', 'Dalam Proses')
ON CONFLICT DO NOTHING;
