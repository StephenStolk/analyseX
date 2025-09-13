create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null references public.subscription_plans(id),
  razorpay_order_id text not null,
  razorpay_payment_id text not null,
  razorpay_signature text not null,
  amount numeric(10,2),
  currency text,
  status text default 'captured', -- created, failed, refunded
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.payments enable row level security;

create policy "users_can_insert_own_payments"
  on public.payments for insert
  with check (auth.uid() = user_id);

create policy "users_can_select_own_payments"
  on public.payments for select
  using (auth.uid() = user_id);
