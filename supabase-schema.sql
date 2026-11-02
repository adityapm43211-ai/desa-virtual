-- Jalankan seluruh isi file ini di Supabase > SQL Editor.
-- Periksa dan pahami kebijakan sebelum membuka layanan untuk publik.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  platform_id text unique not null,
  display_name text not null default 'Warga Baru',
  role text not null default 'resident' check (role in ('admin','resident')),
  balance integer not null default 1000 check (balance >= 0),
  created_at timestamptz not null default now()
);

create function public.make_platform_id() returns text
language sql volatile as $$
  select 'DV-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
$$;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, platform_id, display_name)
  values (new.id, public.make_platform_id(),
    coalesce(nullif(new.raw_user_meta_data->>'display_name',''), 'Warga Baru'));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table public.buildings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'house',
  x numeric not null default 0,
  z numeric not null default 0,
  color text not null default '#e8d3a8',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

create table public.market_items (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  price_cc integer not null default 0 check (price_cc >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  note text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.buildings enable row level security;
alter table public.chat_messages enable row level security;
alter table public.market_items enable row level security;
alter table public.credit_ledger enable row level security;

-- Setiap warga hanya dapat membaca baris profil miliknya sendiri.
-- Pengubahan profil/role/saldo belum dibuka dari browser pada prototipe ini.
create policy "read own profile" on public.profiles
for select to authenticated using (auth.uid() = id);

-- Semua warga dapat melihat bangunan; hanya admin dapat mengubah.
create policy "buildings readable" on public.buildings
for select to authenticated using (true);
create policy "admins manage buildings" on public.buildings
for all to authenticated
using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'))
with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

-- Chat hanya untuk pengguna masuk. Pengirim hanya dapat menghapus/mengubah pesannya sendiri.
create policy "signed in read chat" on public.chat_messages
for select to authenticated using (true);
create policy "send own chat" on public.chat_messages
for insert to authenticated with check (user_id=auth.uid());
create policy "manage own chat" on public.chat_messages
for delete to authenticated using (user_id=auth.uid());

-- Produk dapat dibaca warga yang masuk; penjual hanya mengelola miliknya.
create policy "read market" on public.market_items
for select to authenticated using (true);
create policy "seller add item" on public.market_items
for insert to authenticated with check (seller_id=auth.uid());
create policy "seller update own item" on public.market_items
for update to authenticated using (seller_id=auth.uid()) with check (seller_id=auth.uid());
create policy "seller delete own item" on public.market_items
for delete to authenticated using (seller_id=auth.uid());

create policy "read own ledger" on public.credit_ledger
for select to authenticated using (user_id=auth.uid());

-- Jangan mengaktifkan pembelian/pemindahan saldo sebelum fungsi transaksi aman dibuat.
-- Set admin secara manual setelah akun pertama berhasil dibuat:
-- update public.profiles set role='admin' where id='UUID_AKUN_KAMU';
-- Jangan pernah menaruh service_role key di website atau membagikannya kepada siapa pun.
