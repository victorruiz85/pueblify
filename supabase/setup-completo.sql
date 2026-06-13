-- ============================================================
--  Pueblify · Script de instalación completo (todo en uno)
--  Pega y ejecuta en el SQL Editor de Supabase (orden correcto).
-- ============================================================


-- ============================================================
-- ===== migrations/0001_schema.sql =====
-- ============================================================

-- ============================================================
--  Pueblify · Esquema de producción (v1.2)
--  Modelo orientado a ATRACCIÓN DE POBLACIÓN.
--  Unidad de valor: el HOGAR ASENTADO (no la vivienda alquilada).
-- ============================================================

-- ---------- Tipos enumerados ----------
create type user_role          as enum ('tecnico','propietario','empresa','ayuntamiento','agente_desarrollo','administrador');
create type estado_caso         as enum ('interesado','acompanamiento','instalado','asentado','baja');
create type origen_hogar        as enum ('retorno','exodo_urbano','internacional','movilidad_local');
create type canal_origen        as enum ('web','ayuntamiento','empresa','gal','evento');
create type tipo_miembro        as enum ('adulto','menor');
create type situacion_miembro   as enum ('trabaja','busca_empleo','estudia','cuidados','jubilado','no_aplica');
create type categoria_senal     as enum ('empleo_pareja','escolarizacion','transporte','teletrabajo','dependencia','conciliacion','integracion_social');
create type estado_senal        as enum ('necesario','en_proceso','resuelto','no_aplica');
create type estado_vivienda     as enum ('borrador','revision','publicada','reservada','alquilada');
create type tipo_vivienda       as enum ('piso','casa','estudio','habitacion');
create type ventana_retencion   as enum ('m3','m6','m12','m24');
create type motivo_baja         as enum ('empleo','vivienda','servicios','escolarizacion','vinculos_sociales','personal','otro');
create type riesgo_despoblacion as enum ('critico','alto','medio','bajo');

-- ---------- Perfiles (extiende auth.users) ----------
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'tecnico',
  full_name   text not null,
  email       text not null,
  org         text,
  created_at  timestamptz not null default now()
);

-- ---------- Municipios (con vitalidad) ----------
create table municipalities (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text unique not null,
  nombre               text not null,
  provincia            text not null,
  poblacion_base       integer,
  objetivo_nuevos      integer not null default 0,
  matricula_escolar    integer not null default 0,
  umbral_escolar       integer not null default 0,
  riesgo_despoblacion  riesgo_despoblacion default 'medio',
  latitud              numeric(9,6),
  longitud             numeric(9,6),
  created_at           timestamptz not null default now()
);

-- ---------- Empresas y vacantes ----------
create table companies (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references profiles(id) on delete set null,
  municipality_id uuid references municipalities(id) on delete set null,
  nombre        text not null,
  sector        text,
  vacantes      integer not null default 0,
  es_tractora   boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ---------- Viviendas (habilitador) ----------
create table properties (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid references profiles(id) on delete set null,
  municipality_id uuid references municipalities(id) on delete set null,
  titulo          text not null,
  tipo            tipo_vivienda not null default 'piso',
  plazas          smallint not null default 1,
  precio          numeric(8,2) not null default 0,
  estado          estado_vivienda not null default 'borrador',
  admite_mascotas boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ---------- Hogar (unidad de convivencia) ----------
create table households (
  id              uuid primary key default gen_random_uuid(),
  lead_profile_id uuid references profiles(id) on delete set null,
  contacto        text not null,
  email           text,
  telefono        text,
  tamano          smallint not null default 1,
  origen          origen_hogar,
  origen_region   text,
  vinculos_previos boolean not null default false,
  created_at      timestamptz not null default now()
);

create table household_members (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references households(id) on delete cascade,
  tipo          tipo_miembro not null,
  edad          smallint,
  situacion     situacion_miembro not null default 'no_aplica',
  etapa_escolar text
);

-- Señales de arraigo (Mejora 2)
create table arraigo_signals (
  household_id  uuid not null references households(id) on delete cascade,
  categoria     categoria_senal not null,
  estado        estado_senal not null default 'no_aplica',
  primary key (household_id, categoria)
);

-- ---------- Caso de reubicación (entidad central) ----------
create table relocations (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households(id) on delete cascade,
  municipality_id uuid references municipalities(id) on delete set null,
  property_id     uuid references properties(id) on delete set null,
  company_id      uuid references companies(id) on delete set null,
  agent_id        uuid references profiles(id) on delete set null,
  estado          estado_caso not null default 'interesado',
  canal           canal_origen not null default 'gal',
  -- Hitos (cada uno sella su fecha al marcarse; el técnico ve checklist, no estados)
  hito_vivienda     timestamptz,
  hito_empleo       timestamptz,
  hito_empleo_pareja timestamptz,
  hito_menores      timestamptz,
  hito_mudanza      timestamptz,
  hito_empadronado  timestamptz,
  proximo_hito      text,
  proximo_hito_fecha date,
  nota              text,
  -- Tareas operativas del caso (lista embebida, no es una tabla aparte).
  tareas            jsonb not null default '[]'::jsonb,
  motivo_baja       motivo_baja,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Empadronamiento (hito de "nuevo habitante"). Un padrón por caso.
create table padron_records (
  id              uuid primary key default gen_random_uuid(),
  relocation_id   uuid not null references relocations(id) on delete cascade,
  municipality_id uuid references municipalities(id) on delete set null,
  personas        smallint not null,
  menores         smallint not null default 0,
  fecha           date not null,
  fuente          text,
  created_at      timestamptz not null default now(),
  unique (relocation_id)
);

-- Retención (prueba de que se fija población)
create table retention_checkpoints (
  id             uuid primary key default gen_random_uuid(),
  relocation_id  uuid not null references relocations(id) on delete cascade,
  ventana        ventana_retencion not null,
  vence          date not null,
  completado     date,
  sigue_residiendo boolean,
  satisfaccion   smallint,
  unique (relocation_id, ventana)
);

-- ============================================================
-- ===== migrations/0002_indices_rls.sql =====
-- ============================================================

-- ============================================================
--  Pueblify · Índices, vistas, funciones, RLS  (v1.2)
-- ============================================================

-- ---------- Índices de rendimiento ----------
create index idx_relocations_estado    on relocations(estado);
create index idx_relocations_muni      on relocations(municipality_id);
create index idx_relocations_agent     on relocations(agent_id);
create index idx_members_household     on household_members(household_id);
create index idx_padron_reloc          on padron_records(relocation_id);
create index idx_padron_muni           on padron_records(municipality_id);
create index idx_properties_muni       on properties(municipality_id);
create index idx_companies_muni        on companies(municipality_id);

-- ---------- ¿Es administrador? ----------
create or replace function is_admin() returns boolean
language sql security definer stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'administrador');
$$;

-- ---------- Índice de Arraigo (Mejora 3) ----------
-- Score 0..100 por reglas simples sobre factores observables.
create or replace function calcular_arraigo(p_reloc uuid) returns smallint
language plpgsql stable as $$
declare
  r relocations;
  hay_menores boolean;
  hay_pareja  boolean;
  algun_trabaja boolean;
  meses numeric;
  peso_total numeric := 0;
  acum numeric := 0;
  s_emp_pareja estado_senal;
  s_escol      estado_senal;
  s_integr     estado_senal;
  sub_tiempo numeric;
begin
  select * into r from relocations where id = p_reloc;
  if not found then return 0; end if;

  select exists(select 1 from household_members where household_id = r.household_id and tipo='menor')
    into hay_menores;
  select (count(*) >= 2) into hay_pareja from household_members where household_id = r.household_id and tipo='adulto';
  select exists(select 1 from household_members where household_id = r.household_id and tipo='adulto' and situacion='trabaja')
    into algun_trabaja;

  select estado into s_emp_pareja from arraigo_signals where household_id=r.household_id and categoria='empleo_pareja';
  select estado into s_escol      from arraigo_signals where household_id=r.household_id and categoria='escolarizacion';
  select estado into s_integr     from arraigo_signals where household_id=r.household_id and categoria='integracion_social';

  meses := extract(epoch from (now() - coalesce(r.hito_mudanza, r.hito_empadronado))) / (60*60*24*30.44);
  sub_tiempo := case
    when r.hito_mudanza is null and r.hito_empadronado is null then 0
    when meses >= 12 then 1 when meses >= 6 then 0.73 when meses >= 3 then 0.47 else 0.2 end;

  -- Empleo estable (20)
  peso_total := peso_total + 20;
  acum := acum + 20 * (case when r.hito_empleo is not null then 1 when algun_trabaja then 0.5 else 0 end);

  -- Empleo pareja (10) si aplica
  if hay_pareja then
    peso_total := peso_total + 10;
    acum := acum + 10 * (case when r.hito_empleo_pareja is not null then 1
                              when s_emp_pareja='resuelto' then 1 when s_emp_pareja='en_proceso' then 0.5 else 0 end);
  end if;

  -- Vivienda estable (15)
  peso_total := peso_total + 15;
  acum := acum + 15 * (case when r.hito_vivienda is not null or r.property_id is not null then 1 else 0 end);

  -- Escolarización (20) si hay menores
  if hay_menores then
    peso_total := peso_total + 20;
    acum := acum + 20 * (case when r.hito_menores is not null then 1
                              when s_escol='resuelto' then 1 when s_escol='en_proceso' then 0.5 else 0 end);
  end if;

  -- Integración (10)
  peso_total := peso_total + 10;
  acum := acum + 10 * (case when s_integr='resuelto' then 1 when s_integr='en_proceso' then 0.5 else 0 end);

  -- Tiempo de residencia (15)
  peso_total := peso_total + 15;
  acum := acum + 15 * sub_tiempo;

  -- Vínculos previos (10)
  peso_total := peso_total + 10;
  acum := acum + 10 * (select case when vinculos_previos then 1 else 0 end from households where id = r.household_id);

  return round(100 * acum / nullif(peso_total,0))::smallint;
end; $$;

-- ---------- Estadísticas municipales (alimentan el Índice Pueblify) ----------
create or replace view municipio_stats as
select
  m.id as municipality_id,
  m.nombre,
  m.objetivo_nuevos,
  greatest(1, m.umbral_escolar - m.matricula_escolar) as objetivo_menores,
  coalesce(sum(pr.personas) filter (where r.estado <> 'baja'), 0)
    - coalesce(sum(pr.personas) filter (where r.estado = 'baja'), 0) as habitantes_fijados,
  coalesce(sum(pr.menores) filter (where r.estado <> 'baja'), 0) as menores_incorporados,
  count(distinct r.id) filter (where r.estado = 'asentado') as asentados,
  count(distinct r.id) filter (where r.estado = 'baja') as bajas
from municipalities m
left join relocations r   on r.municipality_id = m.id
left join padron_records pr on pr.relocation_id = r.id
group by m.id, m.nombre, m.objetivo_nuevos, m.umbral_escolar, m.matricula_escolar;

-- ---------- RLS ----------
alter table profiles               enable row level security;
alter table households             enable row level security;
alter table household_members      enable row level security;
alter table arraigo_signals        enable row level security;
alter table relocations            enable row level security;
alter table padron_records         enable row level security;
alter table retention_checkpoints  enable row level security;
alter table properties             enable row level security;
alter table companies              enable row level security;
alter table municipalities         enable row level security;

-- Perfil propio
create policy profiles_self on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_upd  on profiles for update using (id = auth.uid());

-- Municipios: lectura pública, escritura admin
create policy muni_read  on municipalities for select using (true);
create policy muni_write on municipalities for all using (is_admin()) with check (is_admin());

-- Viviendas y empresas publicadas: lectura pública; gestión por dueño/admin
create policy prop_read  on properties for select using (estado='publicada' or owner_id=auth.uid() or is_admin());
create policy prop_write on properties for all using (owner_id=auth.uid() or is_admin()) with check (owner_id=auth.uid() or is_admin());
create policy comp_read  on companies  for select using (true);
create policy comp_write on companies  for all using (owner_id=auth.uid() or is_admin()) with check (owner_id=auth.uid() or is_admin());

-- Casos y hogares: el agente que tutela, el propio hogar, o el admin.
-- (El ayuntamiento NO accede aquí: consume agregados vía municipio_stats.)
create policy reloc_access on relocations for all using (
  is_admin()
  or agent_id = auth.uid()
  or exists (select 1 from households h where h.id = household_id and h.lead_profile_id = auth.uid())
) with check (
  is_admin() or agent_id = auth.uid()
);

create policy household_access on households for all using (
  is_admin() or lead_profile_id = auth.uid()
  or exists (select 1 from relocations r where r.household_id = households.id and r.agent_id = auth.uid())
);

create policy members_access on household_members for all using (
  exists (select 1 from households h where h.id = household_id and (h.lead_profile_id = auth.uid() or is_admin()))
  or exists (select 1 from relocations r where r.household_id = household_members.household_id and r.agent_id = auth.uid())
);

create policy signals_access on arraigo_signals for all using (
  exists (select 1 from relocations r where r.household_id = arraigo_signals.household_id and (r.agent_id = auth.uid() or is_admin()))
);

create policy padron_access on padron_records for all using (
  is_admin() or exists (select 1 from relocations r where r.id = relocation_id and r.agent_id = auth.uid())
);

create policy retention_access on retention_checkpoints for all using (
  is_admin() or exists (select 1 from relocations r where r.id = relocation_id and r.agent_id = auth.uid())
);

-- ============================================================
-- ===== migrations/0003_ref_municipios.sql =====
-- ============================================================

-- ============================================================
--  Pueblify · Catálogo oficial de municipios (referencia)
--  Datos del INE (municipios + provincia + código INE) y códigos postales.
--  Tablas de SOLO LECTURA que se cargan con scripts/import-municipios.mjs.
--  El admin "activa" un municipio en `municipalities` eligiéndolo de aquí
--  (provincia → municipio → CP), sin tecleo manual.
-- ============================================================

-- Municipios oficiales (≈8.131). PK = código INE de 5 dígitos.
create table if not exists ref_municipios (
  ine_code   text primary key,           -- p. ej. "31201" (Sangüesa)
  nombre     text not null,
  provincia  text not null,
  ccaa       text
);
create index if not exists idx_ref_muni_prov on ref_municipios(provincia);

-- Códigos postales por municipio (relación N:N: una ciudad tiene varios CP).
create table if not exists ref_codigos_postales (
  cp        text not null,               -- "31400"
  ine_code  text not null references ref_municipios(ine_code) on delete cascade,
  primary key (cp, ine_code)
);
create index if not exists idx_ref_cp_ine on ref_codigos_postales(ine_code);

-- Enlazar los municipios OPERATIVOS de Pueblify con el catálogo oficial.
alter table municipalities add column if not exists ine_code text references ref_municipios(ine_code);
alter table municipalities add column if not exists cp text;

-- RLS: el catálogo oficial es público de lectura; nadie lo edita desde la app
-- (se carga por el importador con service role).
alter table ref_municipios       enable row level security;
alter table ref_codigos_postales enable row level security;
create policy ref_muni_read on ref_municipios       for select using (true);
create policy ref_cp_read   on ref_codigos_postales for select using (true);

-- ============================================================
-- ===== migrations/0004_poblacion_centros.sql =====
-- ============================================================

-- ============================================================
--  Pueblify · Población oficial (INE) y centros educativos
--  Amplía el catálogo de referencia (ver 0003). Solo lectura desde la app;
--  se carga con scripts/import-municipios.mjs (--pob y --centros).
-- ============================================================

-- (1) Población oficial por municipio (Padrón del INE)
alter table ref_municipios add column if not exists poblacion integer;

-- (2) Centros educativos (Registro de Centros del Ministerio de Educación)
create table if not exists ref_centros (
  codigo    text primary key,                -- código de centro
  nombre    text not null,
  ine_code  text references ref_municipios(ine_code) on delete cascade,
  etapas    text                              -- "Infantil, Primaria, ESO"
);
create index if not exists idx_ref_centros_ine on ref_centros(ine_code);

-- Vista práctica: ¿tiene colegio el municipio y de qué etapas?
create or replace view municipio_escolarizacion as
select
  m.ine_code,
  m.nombre,
  count(c.codigo)                              as n_centros,
  string_agg(distinct c.etapas, ' · ')         as etapas,
  (count(c.codigo) = 0)                         as sin_colegio
from ref_municipios m
left join ref_centros c on c.ine_code = m.ine_code
group by m.ine_code, m.nombre;

-- RLS de la nueva tabla (lectura pública; se carga por el importador con service role)
alter table ref_centros enable row level security;
create policy ref_centros_read on ref_centros for select using (true);

-- ============================================================
-- ===== migrations/0005_consentimiento.sql =====
-- ============================================================

-- ============================================================
--  Pueblify · RGPD — registro del consentimiento informado
--  Guarda cuándo y con qué versión del aviso se obtuvo el consentimiento
--  del hogar (principio de responsabilidad proactiva, art. 5.2 RGPD).
-- ============================================================

alter table households add column if not exists consent_at      timestamptz;
alter table households add column if not exists consent_version text;

-- ============================================================
-- ===== migrations/0006_companies_cp.sql =====
-- ============================================================

-- ============================================================
--  Pueblify · CP de la empresa (heredado del municipio)
--  La empresa toma el código postal de su municipio (se elige en un
--  desplegable y el CP se autocompleta).
-- ============================================================

alter table companies add column if not exists cp text;

-- ============================================================
-- ===== seed.sql =====
-- ============================================================

-- ============================================================
--  Pueblify · Datos de ejemplo (piloto comarca de Sangüesa)
--  Carga municipios, empresas y viviendas (no requieren auth.users).
--  Hogares y casos se crean desde la app una vez autenticado el técnico.
-- ============================================================

insert into municipalities (slug, nombre, provincia, poblacion_base, objetivo_nuevos, matricula_escolar, umbral_escolar, riesgo_despoblacion, cp)
values
  ('sanguesa', 'Sangüesa', 'Navarra', 5040, 60, 182, 150, 'medio',   '31400'),
  ('lumbier',  'Lumbier',  'Navarra', 1410, 30,  96, 105, 'alto',    '31440'),
  ('aibar',    'Aibar',    'Navarra',  790, 18,  41,  45, 'critico', '31479');

insert into companies (municipality_id, nombre, sector, vacantes, es_tractora, cp)
select id, 'Conservas del Pirineo', 'Agroalimentario', 18, true,  cp from municipalities where slug='sanguesa'
union all
select id, 'Aserradero de Lumbier',  'Madera',          6, false, cp from municipalities where slug='lumbier'
union all
select id, 'Residencia Santa Eufemia','Sociosanitario', 4, false, cp from municipalities where slug='aibar';

insert into properties (municipality_id, titulo, tipo, plazas, precio, estado, admite_mascotas)
select id, 'Piso reformado centro', 'piso'::tipo_vivienda, 4, 480, 'publicada'::estado_vivienda, true from municipalities where slug='sanguesa'
union all
select id, 'Casa con patio', 'casa'::tipo_vivienda, 5, 600, 'publicada'::estado_vivienda, true from municipalities where slug='sanguesa'
union all
select id, 'Casa de pueblo rehabilitada', 'casa'::tipo_vivienda, 5, 520, 'publicada'::estado_vivienda, true from municipalities where slug='lumbier'
union all
select id, 'Casa con huerto', 'casa'::tipo_vivienda, 4, 380, 'publicada'::estado_vivienda, true from municipalities where slug='aibar';
