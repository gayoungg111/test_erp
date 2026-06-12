-- Supabase SQL Editor에서 실행하세요.
-- 저장은 Vercel/백엔드 API가 service_role 키(supabase_service_role_key)로 수행합니다.

create table if not exists public.download_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  nickname text not null,
  file_format text not null check (file_format in ('word', 'excel', 'pdf')),
  record_count integer,
  created_at timestamptz not null default now()
);

create index if not exists download_requests_created_at_idx
  on public.download_requests (created_at desc);

alter table public.download_requests enable row level security;

drop policy if exists "Allow anonymous insert on download_requests" on public.download_requests;

create policy "Allow anonymous insert on download_requests"
  on public.download_requests
  for insert
  to anon
  with check (true);

-- service_role은 RLS를 우회하므로 별도 정책 없이 insert 가능합니다.
