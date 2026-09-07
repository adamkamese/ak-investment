-- =============================================================================
-- Boboda Business Dashboard - Supabase setup
-- Run this ENTIRE script once:  Supabase -> SQL Editor -> New query -> paste -> Run
--
-- What it creates:
--   1) app_state        - the ONE table the web app reads/writes (required).
--   2) reporting tables - one per entity (drivers, vehicles, contracts, deposits,
--                         consultancy, ...). These are filled AUTOMATICALLY from
--                         app_state on every save by a trigger, so you can browse
--                         and run SQL reports on them. The app does not need them
--                         to run, and you never edit them by hand.
--
-- After running this: paste your Project URL + anon key into js/core.js (const CLOUD),
-- deploy to Netlify, and use the app normally. Every save updates all tables.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) APP STORAGE (required by the web app)
-- ---------------------------------------------------------------------------
create table if not exists public.app_state (
  id         text primary key,
  data       jsonb,
  updated_at timestamptz default now()
);
alter table public.app_state enable row level security;
grant select, insert, update on public.app_state to anon;
drop policy if exists "read"   on public.app_state;
drop policy if exists "insert" on public.app_state;
drop policy if exists "update" on public.app_state;
create policy "read"   on public.app_state for select using (true);
create policy "insert" on public.app_state for insert with check (true);
create policy "update" on public.app_state for update using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 2) REPORTING TABLES (auto-filled; browse/query in Supabase)
-- ---------------------------------------------------------------------------
create table if not exists public.drivers (
  id text primary key, name text, phone text, active boolean
);
create table if not exists public.vehicles (
  id text primary key, plate text, chassis text, purchase_date date,
  purchase_amount numeric, colour text, model text, has_insurance boolean,
  insurance_start date, insurance_end date, status text, status_date date
);
create table if not exists public.vehicle_repairs (
  id text primary key, vehicle_id text, type text, date date, cost numeric
);
create table if not exists public.contracts (
  id text primary key, code text, driver_id text, vehicle_id text, driver_phone text,
  start_date date, duration_months numeric, duration_weeks numeric, end_date date,
  purchase_price numeric, daily_rate numeric, fine_mode text, fine_amount numeric,
  referral_name text, referral_phone text, status text, terminated_on date
);
create table if not exists public.deposits (
  id text primary key, contract_id text, deposit_date date, amount numeric,
  week_start date, fine_paid numeric, note text, created_at text
);
create table if not exists public.consultancy_contracts (
  id text primary key, client text, client_type text, project text, focal text,
  phone text, email text, duration_type text, start_date date, end_date date,
  contract_types text, payment_type text, expected numeric, withhold_tax boolean,
  status text, created_at text
);
create table if not exists public.consultancy_payments (
  id text primary key, contract_id text, amount numeric, date date, note text
);
create table if not exists public.app_users (
  id text primary key, name text, username text, perms jsonb, disabled boolean
);

-- indexes for the foreign-key-style columns
create index if not exists ix_repairs_vehicle on public.vehicle_repairs(vehicle_id);
create index if not exists ix_contracts_driver on public.contracts(driver_id);
create index if not exists ix_contracts_vehicle on public.contracts(vehicle_id);
create index if not exists ix_deposits_contract on public.deposits(contract_id);
create index if not exists ix_conpay_contract on public.consultancy_payments(contract_id);

-- lock reporting tables: only Supabase Studio / service role can read them
do $$ declare t text; begin
  foreach t in array array['drivers','vehicles','vehicle_repairs','contracts','deposits',
      'consultancy_contracts','consultancy_payments','app_users'] loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3) SAFE CAST HELPERS (never throw on blank/odd values)
-- ---------------------------------------------------------------------------
create or replace function public.d(txt text) returns date
  language plpgsql immutable as $$
  begin return nullif(txt,'')::date; exception when others then return null; end $$;
create or replace function public.n(txt text) returns numeric
  language plpgsql immutable as $$
  begin return coalesce(nullif(txt,'')::numeric,0); exception when others then return 0; end $$;
create or replace function public.bl(txt text) returns boolean
  language plpgsql immutable as $$
  begin return coalesce(nullif(txt,'')::boolean,false); exception when others then return false; end $$;

-- ---------------------------------------------------------------------------
-- 4) EXPANDER: turn app_state.data (JSON) into the reporting tables.
--    SECURITY DEFINER so it can write past RLS; wrapped so it can NEVER block
--    the app from saving (a failure just leaves a warning).
-- ---------------------------------------------------------------------------
create or replace function public.expand_app_state() returns trigger
  language plpgsql security definer as $$
begin
  delete from public.deposits;               delete from public.contracts;
  delete from public.vehicle_repairs;        delete from public.vehicles;
  delete from public.drivers;                delete from public.consultancy_payments;
  delete from public.consultancy_contracts;  delete from public.app_users;

  insert into public.drivers(id,name,phone,active)
  select e->>'id', e->>'name', e->>'phone', bl(e->>'active')
  from jsonb_array_elements(coalesce(NEW.data->'drivers','[]'::jsonb)) e
  where nullif(e->>'id','') is not null;

  insert into public.vehicles(id,plate,chassis,purchase_date,purchase_amount,colour,model,
    has_insurance,insurance_start,insurance_end,status,status_date)
  select e->>'id', e->>'plate', e->>'chassis', d(e->>'purchaseDate'), n(e->>'purchaseAmount'),
    e->>'colour', e->>'model', bl(e->>'hasInsurance'), d(e->>'insuranceStart'),
    d(e->>'insuranceEnd'), e->>'status', d(e->>'statusDate')
  from jsonb_array_elements(coalesce(NEW.data->'vehicles','[]'::jsonb)) e
  where nullif(e->>'id','') is not null;

  insert into public.vehicle_repairs(id,vehicle_id,type,date,cost)
  select r->>'id', e->>'id', r->>'type', d(r->>'date'), n(r->>'cost')
  from jsonb_array_elements(coalesce(NEW.data->'vehicles','[]'::jsonb)) e,
       jsonb_array_elements(coalesce(e->'repairs','[]'::jsonb)) r
  where nullif(r->>'id','') is not null;

  insert into public.contracts(id,code,driver_id,vehicle_id,driver_phone,start_date,
    duration_months,duration_weeks,end_date,purchase_price,daily_rate,fine_mode,
    fine_amount,referral_name,referral_phone,status,terminated_on)
  select e->>'id', e->>'code', e->>'driverId', coalesce(e->>'vehicleId',e->>'bikeId'),
    e->>'driverPhone', d(e->>'startDate'), n(e->>'durationMonths'), n(e->>'durationWeeks'),
    d(e->>'endDate'), n(e->>'purchasePrice'), n(e->>'dailyRate'), e->>'fineMode',
    n(e->>'fineAmount'), e->>'referralName', e->>'referralPhone', e->>'status', d(e->>'terminatedOn')
  from jsonb_array_elements(coalesce(NEW.data->'contracts','[]'::jsonb)) e
  where nullif(e->>'id','') is not null;

  insert into public.deposits(id,contract_id,deposit_date,amount,week_start,fine_paid,note,created_at)
  select e->>'id', e->>'contractId', d(e->>'depositDate'), n(e->>'amount'), d(e->>'weekStart'),
    n(e->>'finePaid'), e->>'note', e->>'createdAt'
  from jsonb_array_elements(coalesce(NEW.data->'deposits','[]'::jsonb)) e
  where nullif(e->>'id','') is not null;

  insert into public.consultancy_contracts(id,client,client_type,project,focal,phone,email,
    duration_type,start_date,end_date,contract_types,payment_type,expected,withhold_tax,status,created_at)
  select e->>'id', e->>'client', e->>'clientType', e->>'project', e->>'focal', e->>'phone', e->>'email',
    e->>'durationType', d(e->>'startDate'), d(e->>'endDate'),
    (select string_agg(x,', ') from jsonb_array_elements_text(coalesce(e->'contractTypes','[]'::jsonb)) x),
    e->>'paymentType', n(e->>'expected'), bl(e->>'withholdTax'), e->>'status', e->>'createdAt'
  from jsonb_array_elements(coalesce(NEW.data->'consultancy','[]'::jsonb)) e
  where nullif(e->>'id','') is not null;

  insert into public.consultancy_payments(id,contract_id,amount,date,note)
  select p->>'id', e->>'id', n(p->>'amount'), d(p->>'date'), p->>'note'
  from jsonb_array_elements(coalesce(NEW.data->'consultancy','[]'::jsonb)) e,
       jsonb_array_elements(coalesce(e->'payments','[]'::jsonb)) p
  where nullif(p->>'id','') is not null;

  insert into public.app_users(id,name,username,perms,disabled)
  select e->>'id', e->>'name', e->>'username', e->'perms', bl(e->>'disabled')
  from jsonb_array_elements(coalesce(NEW.data->'users','[]'::jsonb)) e
  where nullif(e->>'id','') is not null;

  return NEW;
exception when others then
  raise warning 'expand_app_state skipped: %', sqlerrm;   -- never block a save
  return NEW;
end $$;

drop trigger if exists trg_expand_app_state on public.app_state;
create trigger trg_expand_app_state
  after insert or update on public.app_state
  for each row execute function public.expand_app_state();

-- If app_state already has data, fill the reporting tables now:
update public.app_state set updated_at = now() where id = 'main';

-- Done. Browse: Supabase -> Table editor. Query: Supabase -> SQL editor, e.g.
--   select status, count(*), sum(amount) from deposits d
--     join contracts c on c.id = d.contract_id group by 1;
