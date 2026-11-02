-- Supabase / Postgres Schema for Client & Sales Tracker
-- Single-user internal tool database schema

-- 1. Clients
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name text,
  contact_phone text,
  contact_email text,
  website_url text,              -- the site built for them
  bought_website boolean default false,
  bought_accessory boolean default false,
  deal_type text check (deal_type in ('recurring', 'one_time_flat', 'one_time_upsell_later')),
  notes text,
  created_at timestamptz default now()
);

-- 2. Orders (Total paid is NOT stored, dynamically computed by summing orders.amount)
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  item_type text not null,
  amount numeric not null,
  order_date date default current_date,
  notes text,
  created_at timestamptz default now()
);

-- 3. Prospects
create table if not exists prospects (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name text,
  contact_phone text,
  contact_email text,
  notes text,
  status text check (status in ('not_contacted', 'contacted', 'follow_up')) default 'not_contacted',
  created_at timestamptz default now()
);

-- 4. Categories & Products (Admin editable, includes cost_amount for profit computation)
create table if not exists categories (
  id text primary key,
  name text not null,
  icon text default 'tag',
  description text,
  default_amount numeric,
  cost_amount numeric default 0,
  created_at timestamptz default now()
);

-- 5. Inventory Items (with reorder threshold alerts)
create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  category_id text references categories(id) on delete set null,
  item_name text not null,
  quantity_on_hand integer default 0,
  reorder_threshold integer default 5,
  notes text,
  updated_at timestamptz default now()
);

-- 6. Tasks & Follow-ups
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  task_type text check (task_type in ('follow_up_call', 'needs_help', 'reorder', 'other')) not null,
  description text not null,
  due_date date,
  status text check (status in ('open', 'done')) default 'open',
  created_at timestamptz default now()
);

-- 7. Sales Scripts Tracker
create table if not exists scripts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category_id text references categories(id) on delete set null,
  effectiveness text check (effectiveness in ('working', 'not_working', 'testing')) default 'testing',
  notes text,
  updated_at timestamptz default now()
);

-- 8. Employees / Team Directory
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  contact_phone text,
  contact_email text,
  notes text,
  created_at timestamptz default now()
);

-- 9. Notes & Action Items (AI memory)
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  title text,
  content text not null,
  tags text[],
  is_pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 10. Dashboard Configuration (flat jsonb object of toggles)
create table if not exists dashboard_config (
  id integer primary key default 1,
  config jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- 11. Application Settings (stores password SHA-256 hash for gate lock)
create table if not exists app_settings (
  id integer primary key default 1,
  password_hash text not null,
  created_at timestamptz default now()
);
