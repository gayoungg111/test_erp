-- Supabase SQL Editor에서 실행하세요.
-- 여러 번 실행해도 안전합니다. (DROP / DELETE 없음)

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

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'download_requests'
      and policyname = 'Allow anonymous insert on download_requests'
  ) then
    create policy "Allow anonymous insert on download_requests"
      on public.download_requests
      for insert
      to anon
      with check (true);
  end if;
end $$;
