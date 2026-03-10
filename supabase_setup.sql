-- ============================================
-- SMK AI Learning Assistant — Supabase Setup
-- Jalankan di: Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Tabel PROGRESS (status tiap topik)
CREATE TABLE IF NOT EXISTS progress (
  id         TEXT PRIMARY KEY,         -- topic number as text e.g. "1","2"
  topic_id   TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'none',  -- none | wip | done
  teacher    TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel LOGS (catatan handover antar guru)
CREATE TABLE IF NOT EXISTS logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id   TEXT NOT NULL,
  teacher    TEXT NOT NULL,
  status     TEXT DEFAULT 'wip',
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabel TEACHERS (daftar nama guru)
CREATE TABLE IF NOT EXISTS teachers (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

-- 4. Tabel APIS (konfigurasi multi-API load balancer)
CREATE TABLE IF NOT EXISTS apis (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label    TEXT NOT NULL,
  provider TEXT NOT NULL,
  model    TEXT NOT NULL,
  key      TEXT NOT NULL
);

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE apis     ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies — Allow anon full access (demo)
-- Untuk produksi, ganti dengan policy lebih ketat
-- ============================================

-- PROGRESS
CREATE POLICY "anon_all_progress" ON progress
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- LOGS
CREATE POLICY "anon_all_logs" ON logs
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- TEACHERS
CREATE POLICY "anon_all_teachers" ON teachers
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- APIS
CREATE POLICY "anon_all_apis" ON apis
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- Insert default teachers (opsional)
-- ============================================
INSERT INTO teachers (name, sort_order) VALUES
  ('Guru 1', 0),
  ('Guru 2', 1),
  ('Guru 3', 2)
ON CONFLICT DO NOTHING;

-- ============================================
-- Selesai! Sekarang ambil URL & anon key dari:
-- Supabase Dashboard → Settings → API
-- Masukkan ke aplikasi via menu ☁️ Supabase
-- ============================================
