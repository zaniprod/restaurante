create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('operador','admin')),
  name text not null
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  name text not null,
  price numeric(10,2),
  manual_value boolean not null default false,
  active boolean not null default true
);

create table sales (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'completed' check (status in ('completed','cancelled')),
  total numeric(10,2) not null,
  edited boolean not null default false
);

create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  name text not null,
  quantity integer not null default 1,
  unit_price numeric(10,2) not null,
  line_total numeric(10,2) not null
);

create table sale_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  method text not null check (method in ('dinheiro','pix','cartao')),
  amount numeric(10,2) not null,
  cash_received numeric(10,2),
  change_given numeric(10,2)
);

create table sale_edits (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  snapshot jsonb not null,
  edited_at timestamptz not null default now()
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  description text not null,
  amount numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create table purchases (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  photo_url text,
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  product_name text not null,
  quantity text not null,
  value numeric(10,2) not null
);
