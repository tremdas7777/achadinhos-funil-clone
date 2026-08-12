create table if not exists public.orders (
  id uuid primary key,
  status text not null default 'pending',
  ironpay_transaction_hash text,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists orders_ironpay_hash_idx on public.orders (ironpay_transaction_hash);

alter table public.orders enable row level security;
-- Acesso apenas via service role (Edge Function achadinhos-api)
