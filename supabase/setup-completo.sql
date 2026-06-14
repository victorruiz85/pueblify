-- ============================================================
--  Pueblify · Script de instalación completo (todo en uno)
--  Pega y ejecuta en el SQL Editor de Supabase (orden correcto).
--  Incluye el catálogo oficial de Navarra (272 municipios).
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
-- ===== migrations/0007_ref_cp_principal.sql =====
-- ============================================================

-- ============================================================
--  Pueblify · CP principal por municipio en el catálogo oficial
--  Simplifica la cascada provincia → municipio → CP (un CP de cabecera).
-- ============================================================

alter table ref_municipios add column if not exists cp_principal text;

-- ============================================================
-- ===== seed_navarra.sql =====
-- ============================================================

-- AUTO-GENERADO · Carga del catálogo oficial de Navarra en ref_municipios.
-- Idempotente (upsert). Requiere migración 0007 (columna cp_principal).

insert into ref_municipios (ine_code, nombre, provincia, ccaa, cp_principal) values
  ('31001', 'Abáigar', 'Navarra', 'Comunidad Foral de Navarra', '31280'),
  ('31002', 'Abárzuza/Abartzuza', 'Navarra', 'Comunidad Foral de Navarra', '31178'),
  ('31003', 'Abaurregaina/Abaurrea Alta', 'Navarra', 'Comunidad Foral de Navarra', '31692'),
  ('31004', 'Abaurrepea/Abaurrea Baja', 'Navarra', 'Comunidad Foral de Navarra', '31692'),
  ('31005', 'Aberin', 'Navarra', 'Comunidad Foral de Navarra', '31264'),
  ('31006', 'Ablitas', 'Navarra', 'Comunidad Foral de Navarra', '31523'),
  ('31007', 'Adiós', 'Navarra', 'Comunidad Foral de Navarra', '31153'),
  ('31008', 'Aguilar de Codés', 'Navarra', 'Comunidad Foral de Navarra', '31228'),
  ('31009', 'Aibar/Oibar', 'Navarra', 'Comunidad Foral de Navarra', '31460'),
  ('31011', 'Allín/Allin', 'Navarra', 'Comunidad Foral de Navarra', '31241'),
  ('31012', 'Allo', 'Navarra', 'Comunidad Foral de Navarra', '31262'),
  ('31010', 'Altsasu/Alsasua', 'Navarra', 'Comunidad Foral de Navarra', '31800'),
  ('31013', 'Améscoa Baja', 'Navarra', 'Comunidad Foral de Navarra', '31272'),
  ('31014', 'Ancín/Antzin', 'Navarra', 'Comunidad Foral de Navarra', '31280'),
  ('31015', 'Andosilla', 'Navarra', 'Comunidad Foral de Navarra', '31261'),
  ('31016', 'Ansoáin/Antsoain', 'Navarra', 'Comunidad Foral de Navarra', '31013'),
  ('31017', 'Anue', 'Navarra', 'Comunidad Foral de Navarra', '31708'),
  ('31018', 'Añorbe', 'Navarra', 'Comunidad Foral de Navarra', '31154'),
  ('31019', 'Aoiz/Agoitz', 'Navarra', 'Comunidad Foral de Navarra', '31430'),
  ('31020', 'Araitz', 'Navarra', 'Comunidad Foral de Navarra', '31891'),
  ('31025', 'Arakil', 'Navarra', 'Comunidad Foral de Navarra', '31849'),
  ('31021', 'Aranarache/Aranaratxe', 'Navarra', 'Comunidad Foral de Navarra', '31271'),
  ('31023', 'Aranguren', 'Navarra', 'Comunidad Foral de Navarra', '31192'),
  ('31024', 'Arano', 'Navarra', 'Comunidad Foral de Navarra', '31754'),
  ('31022', 'Arantza', 'Navarra', 'Comunidad Foral de Navarra', '31790'),
  ('31026', 'Aras', 'Navarra', 'Comunidad Foral de Navarra', '31239'),
  ('31027', 'Arbizu', 'Navarra', 'Comunidad Foral de Navarra', '31839'),
  ('31028', 'Arce/Artzi', 'Navarra', 'Comunidad Foral de Navarra', '31438'),
  ('31029', 'Arcos, Los', 'Navarra', 'Comunidad Foral de Navarra', '31210'),
  ('31030', 'Arellano', 'Navarra', 'Comunidad Foral de Navarra', '31263'),
  ('31031', 'Areso', 'Navarra', 'Comunidad Foral de Navarra', '31876'),
  ('31032', 'Arguedas', 'Navarra', 'Comunidad Foral de Navarra', '31513'),
  ('31033', 'Aria', 'Navarra', 'Comunidad Foral de Navarra', '31671'),
  ('31034', 'Aribe', 'Navarra', 'Comunidad Foral de Navarra', '31671'),
  ('31035', 'Armañanzas', 'Navarra', 'Comunidad Foral de Navarra', '31228'),
  ('31036', 'Arróniz', 'Navarra', 'Comunidad Foral de Navarra', '31243'),
  ('31037', 'Arruazu', 'Navarra', 'Comunidad Foral de Navarra', '31840'),
  ('31038', 'Artajona', 'Navarra', 'Comunidad Foral de Navarra', '31140'),
  ('31039', 'Artazu', 'Navarra', 'Comunidad Foral de Navarra', '31109'),
  ('31040', 'Atez/Atetz', 'Navarra', 'Comunidad Foral de Navarra', '31193'),
  ('31058', 'Auritz/Burguete', 'Navarra', 'Comunidad Foral de Navarra', '31640'),
  ('31041', 'Ayegui/Aiegi', 'Navarra', 'Comunidad Foral de Navarra', '31208'),
  ('31042', 'Azagra', 'Navarra', 'Comunidad Foral de Navarra', '31560'),
  ('31043', 'Azuelo', 'Navarra', 'Comunidad Foral de Navarra', '31228'),
  ('31044', 'Bakaiku', 'Navarra', 'Comunidad Foral de Navarra', '31810'),
  ('31901', 'Barañáin/Barañain', 'Navarra', 'Comunidad Foral de Navarra', '31010'),
  ('31045', 'Barásoain', 'Navarra', 'Comunidad Foral de Navarra', '31395'),
  ('31046', 'Barbarin', 'Navarra', 'Comunidad Foral de Navarra', '31243'),
  ('31047', 'Bargota', 'Navarra', 'Comunidad Foral de Navarra', '31229'),
  ('31048', 'Barillas', 'Navarra', 'Comunidad Foral de Navarra', '31523'),
  ('31049', 'Basaburua', 'Navarra', 'Comunidad Foral de Navarra', '31866'),
  ('31050', 'Baztan', 'Navarra', 'Comunidad Foral de Navarra', '31700'),
  ('31137', 'Beintza-Labaien', 'Navarra', 'Comunidad Foral de Navarra', '31753'),
  ('31051', 'Beire', 'Navarra', 'Comunidad Foral de Navarra', '31393'),
  ('31052', 'Belascoáin', 'Navarra', 'Comunidad Foral de Navarra', '31174'),
  ('31250', 'Bera', 'Navarra', 'Comunidad Foral de Navarra', '31780'),
  ('31053', 'Berbinzana', 'Navarra', 'Comunidad Foral de Navarra', '31252'),
  ('31905', 'Beriáin', 'Navarra', 'Comunidad Foral de Navarra', '31191'),
  ('31902', 'Berrioplano/Berriobeiti', 'Navarra', 'Comunidad Foral de Navarra', '31013'),
  ('31903', 'Berriozar', 'Navarra', 'Comunidad Foral de Navarra', '31013'),
  ('31054', 'Bertizarana', 'Navarra', 'Comunidad Foral de Navarra', '31720'),
  ('31055', 'Betelu', 'Navarra', 'Comunidad Foral de Navarra', '31890'),
  ('31253', 'Bidaurreta', 'Navarra', 'Comunidad Foral de Navarra', '31174'),
  ('31056', 'Biurrun-Olcoz', 'Navarra', 'Comunidad Foral de Navarra', '31398'),
  ('31057', 'Buñuel', 'Navarra', 'Comunidad Foral de Navarra', '31540'),
  ('31059', 'Burgui/Burgi', 'Navarra', 'Comunidad Foral de Navarra', '31412'),
  ('31060', 'Burlada/Burlata', 'Navarra', 'Comunidad Foral de Navarra', '31600'),
  ('31061', 'Busto, El', 'Navarra', 'Comunidad Foral de Navarra', '31229'),
  ('31062', 'Cabanillas', 'Navarra', 'Comunidad Foral de Navarra', '31511'),
  ('31063', 'Cabredo', 'Navarra', 'Comunidad Foral de Navarra', '31227'),
  ('31064', 'Cadreita', 'Navarra', 'Comunidad Foral de Navarra', '31515'),
  ('31065', 'Caparroso', 'Navarra', 'Comunidad Foral de Navarra', '31380'),
  ('31066', 'Cárcar', 'Navarra', 'Comunidad Foral de Navarra', '31579'),
  ('31067', 'Carcastillo', 'Navarra', 'Comunidad Foral de Navarra', '31310'),
  ('31068', 'Cascante', 'Navarra', 'Comunidad Foral de Navarra', '31520'),
  ('31069', 'Cáseda', 'Navarra', 'Comunidad Foral de Navarra', '31312'),
  ('31070', 'Castejón', 'Navarra', 'Comunidad Foral de Navarra', '31590'),
  ('31071', 'Castillonuevo', 'Navarra', 'Comunidad Foral de Navarra', '31454'),
  ('31193', 'Cendea de Olza/Oltza Zendea', 'Navarra', 'Comunidad Foral de Navarra', '31170'),
  ('31072', 'Cintruénigo', 'Navarra', 'Comunidad Foral de Navarra', '31592'),
  ('31074', 'Cirauqui/Zirauki', 'Navarra', 'Comunidad Foral de Navarra', '31131'),
  ('31075', 'Ciriza/Ziritza', 'Navarra', 'Comunidad Foral de Navarra', '31174'),
  ('31076', 'Cizur', 'Navarra', 'Comunidad Foral de Navarra', '31174'),
  ('31077', 'Corella', 'Navarra', 'Comunidad Foral de Navarra', '31591'),
  ('31078', 'Cortes', 'Navarra', 'Comunidad Foral de Navarra', '31530'),
  ('31079', 'Desojo', 'Navarra', 'Comunidad Foral de Navarra', '31229'),
  ('31080', 'Dicastillo', 'Navarra', 'Comunidad Foral de Navarra', '31263'),
  ('31081', 'Donamaria', 'Navarra', 'Comunidad Foral de Navarra', '31750'),
  ('31221', 'Doneztebe/Santesteban', 'Navarra', 'Comunidad Foral de Navarra', '31740'),
  ('31083', 'Echarri/Etxarri', 'Navarra', 'Comunidad Foral de Navarra', '31174'),
  ('31087', 'Elgorriaga', 'Navarra', 'Comunidad Foral de Navarra', '31744'),
  ('31089', 'Enériz/Eneritz', 'Navarra', 'Comunidad Foral de Navarra', '31153'),
  ('31090', 'Eratsun', 'Navarra', 'Comunidad Foral de Navarra', '31748'),
  ('31091', 'Ergoiena', 'Navarra', 'Comunidad Foral de Navarra', '31829'),
  ('31092', 'Erro', 'Navarra', 'Comunidad Foral de Navarra', '31638'),
  ('31094', 'Eslava', 'Navarra', 'Comunidad Foral de Navarra', '31494'),
  ('31095', 'Esparza de Salazar/Espartza Zaraitzu', 'Navarra', 'Comunidad Foral de Navarra', '31453'),
  ('31096', 'Espronceda', 'Navarra', 'Comunidad Foral de Navarra', '31228'),
  ('31097', 'Estella-Lizarra', 'Navarra', 'Comunidad Foral de Navarra', '31200'),
  ('31098', 'Esteribar', 'Navarra', 'Comunidad Foral de Navarra', '31630'),
  ('31099', 'Etayo', 'Navarra', 'Comunidad Foral de Navarra', '31281'),
  ('31082', 'Etxalar', 'Navarra', 'Comunidad Foral de Navarra', '31760'),
  ('31084', 'Etxarri Aranatz', 'Navarra', 'Comunidad Foral de Navarra', '31820'),
  ('31085', 'Etxauri', 'Navarra', 'Comunidad Foral de Navarra', '31174'),
  ('31100', 'Eulate', 'Navarra', 'Comunidad Foral de Navarra', '31271'),
  ('31101', 'Ezcabarte', 'Navarra', 'Comunidad Foral de Navarra', '31194'),
  ('31093', 'Ezcároz/Ezkaroze', 'Navarra', 'Comunidad Foral de Navarra', '31690'),
  ('31102', 'Ezkurra', 'Navarra', 'Comunidad Foral de Navarra', '31749'),
  ('31103', 'Ezprogui', 'Navarra', 'Comunidad Foral de Navarra', '31491'),
  ('31104', 'Falces', 'Navarra', 'Comunidad Foral de Navarra', '31370'),
  ('31105', 'Fitero', 'Navarra', 'Comunidad Foral de Navarra', '31593'),
  ('31106', 'Fontellas', 'Navarra', 'Comunidad Foral de Navarra', '31512'),
  ('31107', 'Funes', 'Navarra', 'Comunidad Foral de Navarra', '31360'),
  ('31108', 'Fustiñana', 'Navarra', 'Comunidad Foral de Navarra', '31510'),
  ('31109', 'Galar', 'Navarra', 'Comunidad Foral de Navarra', '31191'),
  ('31110', 'Gallipienzo/Galipentzu', 'Navarra', 'Comunidad Foral de Navarra', '31493'),
  ('31111', 'Gallués/Galoze', 'Navarra', 'Comunidad Foral de Navarra', '31451'),
  ('31112', 'Garaioa', 'Navarra', 'Comunidad Foral de Navarra', '31692'),
  ('31113', 'Garde', 'Navarra', 'Comunidad Foral de Navarra', '31414'),
  ('31114', 'Garínoain', 'Navarra', 'Comunidad Foral de Navarra', '31395'),
  ('31115', 'Garralda', 'Navarra', 'Comunidad Foral de Navarra', '31693'),
  ('31116', 'Genevilla', 'Navarra', 'Comunidad Foral de Navarra', '31227'),
  ('31117', 'Goizueta', 'Navarra', 'Comunidad Foral de Navarra', '31754'),
  ('31118', 'Goñi', 'Navarra', 'Comunidad Foral de Navarra', '31172'),
  ('31119', 'Güesa/Gorza', 'Navarra', 'Comunidad Foral de Navarra', '31452'),
  ('31120', 'Guesálaz/Gesalatz', 'Navarra', 'Comunidad Foral de Navarra', '31175'),
  ('31121', 'Guirguillano', 'Navarra', 'Comunidad Foral de Navarra', '31174'),
  ('31256', 'Hiriberri/Villanueva de Aezkoa', 'Navarra', 'Comunidad Foral de Navarra', '31671'),
  ('31122', 'Huarte/Uharte', 'Navarra', 'Comunidad Foral de Navarra', '31620'),
  ('31124', 'Ibargoiti', 'Navarra', 'Comunidad Foral de Navarra', '31472'),
  ('31259', 'Igantzi', 'Navarra', 'Comunidad Foral de Navarra', '31790'),
  ('31125', 'Igúzquiza', 'Navarra', 'Comunidad Foral de Navarra', '31241'),
  ('31126', 'Imotz', 'Navarra', 'Comunidad Foral de Navarra', '31867'),
  ('31127', 'Irañeta', 'Navarra', 'Comunidad Foral de Navarra', '31849'),
  ('31904', 'Irurtzun', 'Navarra', 'Comunidad Foral de Navarra', '31860'),
  ('31128', 'Isaba/Izaba', 'Navarra', 'Comunidad Foral de Navarra', '31417'),
  ('31129', 'Ituren', 'Navarra', 'Comunidad Foral de Navarra', '31745'),
  ('31130', 'Iturmendi', 'Navarra', 'Comunidad Foral de Navarra', '31810'),
  ('31131', 'Iza/Itza', 'Navarra', 'Comunidad Foral de Navarra', '31170'),
  ('31132', 'Izagaondoa', 'Navarra', 'Comunidad Foral de Navarra', '31421'),
  ('31133', 'Izalzu/Itzaltzu', 'Navarra', 'Comunidad Foral de Navarra', '31689'),
  ('31134', 'Jaurrieta', 'Navarra', 'Comunidad Foral de Navarra', '31691'),
  ('31135', 'Javier', 'Navarra', 'Comunidad Foral de Navarra', '31409'),
  ('31136', 'Juslapeña', 'Navarra', 'Comunidad Foral de Navarra', '31193'),
  ('31138', 'Lakuntza', 'Navarra', 'Comunidad Foral de Navarra', '31830'),
  ('31139', 'Lana', 'Navarra', 'Comunidad Foral de Navarra', '31283'),
  ('31140', 'Lantz', 'Navarra', 'Comunidad Foral de Navarra', '31798'),
  ('31141', 'Lapoblación', 'Navarra', 'Comunidad Foral de Navarra', '31227'),
  ('31142', 'Larraga', 'Navarra', 'Comunidad Foral de Navarra', '31251'),
  ('31143', 'Larraona', 'Navarra', 'Comunidad Foral de Navarra', '31270'),
  ('31144', 'Larraun', 'Navarra', 'Comunidad Foral de Navarra', '31877'),
  ('31145', 'Lazagurría', 'Navarra', 'Comunidad Foral de Navarra', '31588'),
  ('31146', 'Leache/Leatxe', 'Navarra', 'Comunidad Foral de Navarra', '31460'),
  ('31147', 'Legarda', 'Navarra', 'Comunidad Foral de Navarra', '31133'),
  ('31148', 'Legaria', 'Navarra', 'Comunidad Foral de Navarra', '31281'),
  ('31149', 'Leitza', 'Navarra', 'Comunidad Foral de Navarra', '31880'),
  ('31908', 'Lekunberri', 'Navarra', 'Comunidad Foral de Navarra', '31870'),
  ('31150', 'Leoz/Leotz', 'Navarra', 'Comunidad Foral de Navarra', '31395'),
  ('31151', 'Lerga', 'Navarra', 'Comunidad Foral de Navarra', '31494'),
  ('31152', 'Lerín', 'Navarra', 'Comunidad Foral de Navarra', '31260'),
  ('31153', 'Lesaka', 'Navarra', 'Comunidad Foral de Navarra', '31770'),
  ('31154', 'Lezáun', 'Navarra', 'Comunidad Foral de Navarra', '31177'),
  ('31155', 'Liédena', 'Navarra', 'Comunidad Foral de Navarra', '31487'),
  ('31156', 'Lizoáin-Arriasgoiti', 'Navarra', 'Comunidad Foral de Navarra', '31482'),
  ('31157', 'Lodosa', 'Navarra', 'Comunidad Foral de Navarra', '31580'),
  ('31158', 'Lónguida/Longida', 'Navarra', 'Comunidad Foral de Navarra', '31438'),
  ('31159', 'Lumbier', 'Navarra', 'Comunidad Foral de Navarra', '31440'),
  ('31160', 'Luquin', 'Navarra', 'Comunidad Foral de Navarra', '31243'),
  ('31248', 'Luzaide/Valcarlos', 'Navarra', 'Comunidad Foral de Navarra', '31660'),
  ('31161', 'Mañeru', 'Navarra', 'Comunidad Foral de Navarra', '31130'),
  ('31162', 'Marañón', 'Navarra', 'Comunidad Foral de Navarra', '31227'),
  ('31163', 'Marcilla', 'Navarra', 'Comunidad Foral de Navarra', '31340'),
  ('31164', 'Mélida', 'Navarra', 'Comunidad Foral de Navarra', '31382'),
  ('31165', 'Mendavia', 'Navarra', 'Comunidad Foral de Navarra', '31587'),
  ('31166', 'Mendaza', 'Navarra', 'Comunidad Foral de Navarra', '31219'),
  ('31167', 'Mendigorría', 'Navarra', 'Comunidad Foral de Navarra', '31150'),
  ('31168', 'Metauten', 'Navarra', 'Comunidad Foral de Navarra', '31241'),
  ('31169', 'Milagro', 'Navarra', 'Comunidad Foral de Navarra', '31320'),
  ('31170', 'Mirafuentes', 'Navarra', 'Comunidad Foral de Navarra', '31219'),
  ('31171', 'Miranda de Arga', 'Navarra', 'Comunidad Foral de Navarra', '31253'),
  ('31172', 'Monreal/Elo', 'Navarra', 'Comunidad Foral de Navarra', '31471'),
  ('31173', 'Monteagudo', 'Navarra', 'Comunidad Foral de Navarra', '31522'),
  ('31174', 'Morentin', 'Navarra', 'Comunidad Foral de Navarra', '31264'),
  ('31175', 'Mues', 'Navarra', 'Comunidad Foral de Navarra', '31219'),
  ('31176', 'Murchante', 'Navarra', 'Comunidad Foral de Navarra', '31521'),
  ('31177', 'Murieta', 'Navarra', 'Comunidad Foral de Navarra', '31280'),
  ('31178', 'Murillo el Cuende', 'Navarra', 'Comunidad Foral de Navarra', '31315'),
  ('31179', 'Murillo el Fruto', 'Navarra', 'Comunidad Foral de Navarra', '31313'),
  ('31180', 'Muruzábal', 'Navarra', 'Comunidad Foral de Navarra', '31152'),
  ('31181', 'Navascués/Nabaskoze', 'Navarra', 'Comunidad Foral de Navarra', '31450'),
  ('31182', 'Nazar', 'Navarra', 'Comunidad Foral de Navarra', '31282'),
  ('31088', 'Noáin (Valle de Elorz)/Noain (Elortzibar)', 'Navarra', 'Comunidad Foral de Navarra', '31110'),
  ('31183', 'Obanos', 'Navarra', 'Comunidad Foral de Navarra', '31151'),
  ('31185', 'Ochagavía/Otsagabia', 'Navarra', 'Comunidad Foral de Navarra', '31680'),
  ('31184', 'Oco', 'Navarra', 'Comunidad Foral de Navarra', '31281'),
  ('31186', 'Odieta', 'Navarra', 'Comunidad Foral de Navarra', '31799'),
  ('31187', 'Oiz', 'Navarra', 'Comunidad Foral de Navarra', '31751'),
  ('31188', 'Olaibar', 'Navarra', 'Comunidad Foral de Navarra', '31799'),
  ('31189', 'Olazti/Olazagutía', 'Navarra', 'Comunidad Foral de Navarra', '31809'),
  ('31190', 'Olejua', 'Navarra', 'Comunidad Foral de Navarra', '31281'),
  ('31191', 'Olite/Erriberri', 'Navarra', 'Comunidad Foral de Navarra', '31390'),
  ('31192', 'Olóriz/Oloritz', 'Navarra', 'Comunidad Foral de Navarra', '31395'),
  ('31195', 'Orbaizeta', 'Navarra', 'Comunidad Foral de Navarra', '31670'),
  ('31196', 'Orbara', 'Navarra', 'Comunidad Foral de Navarra', '31671'),
  ('31197', 'Orísoain', 'Navarra', 'Comunidad Foral de Navarra', '31395'),
  ('31906', 'Orkoien', 'Navarra', 'Comunidad Foral de Navarra', '31160'),
  ('31198', 'Oronz/Orontze', 'Navarra', 'Comunidad Foral de Navarra', '31451'),
  ('31199', 'Oroz-Betelu/Orotz-Betelu', 'Navarra', 'Comunidad Foral de Navarra', '31439'),
  ('31211', 'Orreaga/Roncesvalles', 'Navarra', 'Comunidad Foral de Navarra', '31650'),
  ('31200', 'Oteiza', 'Navarra', 'Comunidad Foral de Navarra', '31250'),
  ('31201', 'Pamplona/Iruña', 'Navarra', 'Comunidad Foral de Navarra', '31001'),
  ('31202', 'Peralta/Azkoien', 'Navarra', 'Comunidad Foral de Navarra', '31350'),
  ('31203', 'Petilla de Aragón', 'Navarra', 'Comunidad Foral de Navarra', '50686'),
  ('31204', 'Piedramillera', 'Navarra', 'Comunidad Foral de Navarra', '31219'),
  ('31205', 'Pitillas', 'Navarra', 'Comunidad Foral de Navarra', '31392'),
  ('31206', 'Puente la Reina/Gares', 'Navarra', 'Comunidad Foral de Navarra', '31100'),
  ('31207', 'Pueyo', 'Navarra', 'Comunidad Foral de Navarra', '31394'),
  ('31208', 'Ribaforada', 'Navarra', 'Comunidad Foral de Navarra', '31550'),
  ('31209', 'Romanzado', 'Navarra', 'Comunidad Foral de Navarra', '31448'),
  ('31210', 'Roncal/Erronkari', 'Navarra', 'Comunidad Foral de Navarra', '31415'),
  ('31212', 'Sada', 'Navarra', 'Comunidad Foral de Navarra', '31491'),
  ('31213', 'Saldías', 'Navarra', 'Comunidad Foral de Navarra', '31747'),
  ('31214', 'Salinas de Oro/Jaitz', 'Navarra', 'Comunidad Foral de Navarra', '31175'),
  ('31215', 'San Adrián', 'Navarra', 'Comunidad Foral de Navarra', '31570'),
  ('31217', 'San Martín de Unx', 'Navarra', 'Comunidad Foral de Navarra', '31495'),
  ('31216', 'Sangüesa/Zangoza', 'Navarra', 'Comunidad Foral de Navarra', '31400'),
  ('31219', 'Sansol', 'Navarra', 'Comunidad Foral de Navarra', '31220'),
  ('31220', 'Santacara', 'Navarra', 'Comunidad Foral de Navarra', '31314'),
  ('31222', 'Sarriés/Sartze', 'Navarra', 'Comunidad Foral de Navarra', '31451'),
  ('31223', 'Sartaguda', 'Navarra', 'Comunidad Foral de Navarra', '31589'),
  ('31224', 'Sesma', 'Navarra', 'Comunidad Foral de Navarra', '31293'),
  ('31225', 'Sorlada', 'Navarra', 'Comunidad Foral de Navarra', '31219'),
  ('31226', 'Sunbilla', 'Navarra', 'Comunidad Foral de Navarra', '31791'),
  ('31227', 'Tafalla', 'Navarra', 'Comunidad Foral de Navarra', '31300'),
  ('31228', 'Tiebas-Muruarte de Reta', 'Navarra', 'Comunidad Foral de Navarra', '31397'),
  ('31229', 'Tirapu', 'Navarra', 'Comunidad Foral de Navarra', '31154'),
  ('31230', 'Torralba del Río', 'Navarra', 'Comunidad Foral de Navarra', '31219'),
  ('31231', 'Torres del Río', 'Navarra', 'Comunidad Foral de Navarra', '31229'),
  ('31232', 'Tudela', 'Navarra', 'Comunidad Foral de Navarra', '31500'),
  ('31233', 'Tulebras', 'Navarra', 'Comunidad Foral de Navarra', '31522'),
  ('31234', 'Ucar', 'Navarra', 'Comunidad Foral de Navarra', '31154'),
  ('31123', 'Uharte Arakil', 'Navarra', 'Comunidad Foral de Navarra', '31840'),
  ('31235', 'Ujué', 'Navarra', 'Comunidad Foral de Navarra', '31496'),
  ('31236', 'Ultzama', 'Navarra', 'Comunidad Foral de Navarra', '31797'),
  ('31237', 'Unciti', 'Navarra', 'Comunidad Foral de Navarra', '31422'),
  ('31238', 'Unzué/Untzue', 'Navarra', 'Comunidad Foral de Navarra', '31396'),
  ('31239', 'Urdazubi/Urdax', 'Navarra', 'Comunidad Foral de Navarra', '31711'),
  ('31240', 'Urdiain', 'Navarra', 'Comunidad Foral de Navarra', '31810'),
  ('31241', 'Urraul Alto', 'Navarra', 'Comunidad Foral de Navarra', '31448'),
  ('31242', 'Urraul Bajo', 'Navarra', 'Comunidad Foral de Navarra', '31448'),
  ('31244', 'Urroz', 'Navarra', 'Comunidad Foral de Navarra', '31752'),
  ('31243', 'Urroz-Villa', 'Navarra', 'Comunidad Foral de Navarra', '31420'),
  ('31245', 'Urzainqui/Urzainki', 'Navarra', 'Comunidad Foral de Navarra', '31416'),
  ('31246', 'Uterga', 'Navarra', 'Comunidad Foral de Navarra', '31133'),
  ('31247', 'Uztárroz/Uztarroze', 'Navarra', 'Comunidad Foral de Navarra', '31418'),
  ('31086', 'Valle de Egüés/Eguesibar', 'Navarra', 'Comunidad Foral de Navarra', '31192'),
  ('31194', 'Valle de Ollo/Ollaran', 'Navarra', 'Comunidad Foral de Navarra', '31172'),
  ('31260', 'Valle de Yerri/Deierri', 'Navarra', 'Comunidad Foral de Navarra', '31176'),
  ('31249', 'Valtierra', 'Navarra', 'Comunidad Foral de Navarra', '31514'),
  ('31251', 'Viana', 'Navarra', 'Comunidad Foral de Navarra', '31230'),
  ('31252', 'Vidángoz/Bidankoze', 'Navarra', 'Comunidad Foral de Navarra', '31413'),
  ('31254', 'Villafranca', 'Navarra', 'Comunidad Foral de Navarra', '31330'),
  ('31255', 'Villamayor de Monjardín', 'Navarra', 'Comunidad Foral de Navarra', '31242'),
  ('31257', 'Villatuerta', 'Navarra', 'Comunidad Foral de Navarra', '31132'),
  ('31258', 'Villava/Atarrabia', 'Navarra', 'Comunidad Foral de Navarra', '31610'),
  ('31261', 'Yesa', 'Navarra', 'Comunidad Foral de Navarra', '31410'),
  ('31262', 'Zabalza/Zabaltza', 'Navarra', 'Comunidad Foral de Navarra', '31174'),
  ('31073', 'Ziordia', 'Navarra', 'Comunidad Foral de Navarra', '31809'),
  ('31907', 'Zizur Mayor/Zizur Nagusia', 'Navarra', 'Comunidad Foral de Navarra', '31180'),
  ('31263', 'Zubieta', 'Navarra', 'Comunidad Foral de Navarra', '31746'),
  ('31264', 'Zugarramurdi', 'Navarra', 'Comunidad Foral de Navarra', '31710'),
  ('31265', 'Zúñiga', 'Navarra', 'Comunidad Foral de Navarra', '31284')
on conflict (ine_code) do update set nombre=excluded.nombre, provincia=excluded.provincia, ccaa=excluded.ccaa, cp_principal=excluded.cp_principal;

-- ============================================================
-- ===== seed.sql =====
-- ============================================================

-- ============================================================
--  Pueblify · Datos de ejemplo (piloto comarca de Sangüesa)
--  Carga municipios, empresas y viviendas (no requieren auth.users).
--  Hogares y casos se crean desde la app una vez autenticado el técnico.
-- ============================================================

insert into municipalities (slug, nombre, provincia, poblacion_base, objetivo_nuevos, matricula_escolar, umbral_escolar, riesgo_despoblacion, cp, ine_code)
values
  ('sanguesa', 'Sangüesa', 'Navarra', 5040, 60, 182, 150, 'medio',   '31400', '31216'),
  ('lumbier',  'Lumbier',  'Navarra', 1410, 30,  96, 105, 'alto',    '31440', '31159'),
  ('aibar',    'Aibar',    'Navarra',  790, 18,  41,  45, 'critico', '31460', '31009');

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
