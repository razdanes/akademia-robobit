-- Akademia RoboBit LMS – schemat PostgreSQL (multi-tenancy przez RLS, dane uczniów pseudonimowe)
create extension if not exists pgcrypto;
create type user_role as enum ('school_admin', 'teacher', 'guardian');

create table tenants (               -- szkoła (lub gmina/organ prowadzący)
  id uuid primary key default gen_random_uuid(), name text not null,
  plan text not null default 'free' check (plan in ('free', 'school', 'district')),
  data_region text not null default 'eu', created_at timestamptz not null default now());

create table users (                 -- WYŁĄCZNIE dorośli: dyrektor, nauczyciel, rodzic
  id uuid primary key default gen_random_uuid(), tenant_id uuid references tenants, role user_role not null,
  email text not null unique, display_name text, auth_provider text, created_at timestamptz not null default now());

create table classes (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants, name text not null,
  grade smallint not null check (grade between 1 and 3), school_year text not null,
  join_code text not null unique, archived boolean not null default false);
create table class_teachers (class_id uuid references classes, user_id uuid references users, primary key (class_id, user_id));

create table students (              -- brak nazwiska i e-maila: tylko pseudonim; imię i nazwisko zostaje w dzienniku szkoły
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants,
  nickname text not null, avatar jsonb not null default '{}', pin_hash text, birth_year smallint,
  external_ref text,                 -- opcjonalny identyfikator z e-dziennika (mapowanie po stronie szkoły)
  deleted_at timestamptz, created_at timestamptz not null default now());
create table enrollments (student_id uuid references students, class_id uuid references classes, school_year text, primary key (student_id, class_id));

create table guardians (             -- zgoda rodzica i powiązanie z dzieckiem
  user_id uuid references users, student_id uuid references students, consent_version text not null,
  consent_at timestamptz not null, consent_withdrawn_at timestamptz, primary key (user_id, student_id));

create table modules (               -- katalog treści (wspólny dla wszystkich szkół)
  id text primary key, name text not null, domain text not null check (domain in ('informatyka', 'matematyka', 'jezyki', 'przyroda', 'sztuka', 'bezpieczenstwo')),
  min_grade smallint default 1, version int not null default 1, active boolean not null default true);
create table skills (id text primary key, module_id text not null references modules, name text not null);

create table assignments (           -- „praca domowa” zadana klasie
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants, class_id uuid not null references classes,
  module_id text not null references modules, created_by uuid not null references users, title text,
  config jsonb not null default '{}', due_at timestamptz, created_at timestamptz not null default now());

create table attempts (              -- jedno podejście ucznia do modułu (źródło dla raportów)
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants, student_id uuid not null references students,
  module_id text not null references modules, assignment_id uuid references assignments,
  started_at timestamptz not null, ended_at timestamptz, duration_s int, score int, max_score int,
  errors int not null default 0, actions int not null default 0, difficulty smallint not null default 1, completed boolean not null default false,
  client_event_id uuid not null unique);               -- idempotentna synchronizacja z trybu offline
create index on attempts (tenant_id, student_id, started_at);
create index on attempts (assignment_id);

create table events (                -- surowa telemetria, retencja np. 90 dni
  id bigint generated always as identity, tenant_id uuid not null, student_id uuid not null, attempt_id uuid,
  type text not null, payload jsonb not null default '{}', occurred_at timestamptz not null, primary key (id, occurred_at)) partition by range (occurred_at);

create table student_progress (
  student_id uuid references students, module_id text references modules, tenant_id uuid not null,
  best_score int default 0, attempts_count int default 0, completed_count int default 0, mastery numeric(4, 3) default 0, updated_at timestamptz default now(),
  primary key (student_id, module_id));

create table badges (id text primary key, name text not null, description text);
create table student_badges (student_id uuid references students, badge_id text references badges, tenant_id uuid not null, awarded_at timestamptz default now(), primary key (student_id, badge_id));
create table xp_ledger (id bigint generated always as identity primary key, tenant_id uuid not null, student_id uuid not null references students, delta int not null, reason text not null, ref_id uuid, created_at timestamptz default now());

create table data_requests (         -- RODO: dostęp, eksport, usunięcie
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null, student_id uuid not null, requested_by uuid references users,
  type text not null check (type in ('access', 'export', 'erasure')), status text not null default 'open', created_at timestamptz default now(), completed_at timestamptz);
create table audit_log (id bigint generated always as identity primary key, tenant_id uuid, actor_id uuid, action text not null, target text, at timestamptz default now());
create table integrations (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants, kind text not null check (kind in ('google_classroom', 'lti13', 'csv', 'webhook')), config jsonb not null, created_at timestamptz default now());
create table subscriptions (id uuid primary key default gen_random_uuid(), tenant_id uuid references tenants, owner_user_id uuid references users,
  plan text not null, status text not null, current_period_end timestamptz, provider text, provider_ref text);

-- Izolacja szkół: każde zapytanie aplikacji poprzedza `select set_config('app.tenant_id', '<uuid>', true)`.
do $$ declare t text; begin
  foreach t in array array['classes', 'students', 'assignments', 'attempts', 'student_progress', 'student_badges', 'xp_ledger', 'data_requests', 'audit_log', 'integrations'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy tenant_isolation on %I using (tenant_id = current_setting(''app.tenant_id'', true)::uuid)', t);
  end loop; end $$;

-- Widok dla panelu nauczyciela: statystyki klasy per moduł
create view class_module_stats as
select e.class_id, a.module_id, count(distinct a.student_id) as students, round(sum(a.duration_s) / 60.0, 1) as minutes,
       count(*) filter (where a.completed) as completed, round(sum(a.errors)::numeric / nullif(sum(a.actions), 0), 3) as error_rate
from attempts a join enrollments e on e.student_id = a.student_id group by e.class_id, a.module_id;
