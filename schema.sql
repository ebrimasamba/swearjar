-- SwearJar Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create swears table
CREATE TABLE IF NOT EXISTS swears (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  price_per_swear NUMERIC DEFAULT 5 NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS) for all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE swears ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for public access (no auth MVP)

-- Employees policies
CREATE POLICY "Allow public read on employees" ON employees
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on employees" ON employees
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on employees" ON employees
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on employees" ON employees
  FOR DELETE USING (true);

-- Swears policies
CREATE POLICY "Allow public read on swears" ON swears
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on swears" ON swears
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on swears" ON swears
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on swears" ON swears
  FOR DELETE USING (true);

-- Settings policies
CREATE POLICY "Allow public read on settings" ON settings
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on settings" ON settings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on settings" ON settings
  FOR UPDATE USING (true);

-- 6. Insert default settings row
INSERT INTO settings (id, price_per_swear)
VALUES ('default', 5)
ON CONFLICT (id) DO NOTHING;
