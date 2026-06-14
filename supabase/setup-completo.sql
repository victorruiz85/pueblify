-- ============================================================
--  Pueblify · Script de instalación completo (todo en uno)
--  Pega y ejecuta en el SQL Editor de Supabase (orden correcto).
--  Incluye el catálogo oficial de Soria (183 municipios + población INE
--  + 84 centros educativos de la Junta de Castilla y León).
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
-- ===== seed_soria.sql =====
-- ============================================================

-- AUTO-GENERADO · Catálogo oficial de Soria: municipios (+CP +población INE 2025) y centros educativos (JCyL).
-- Idempotente (upsert). Requiere migraciones 0003/0004 (ref_municipios, ref_centros) y 0007 (cp_principal).

insert into ref_municipios (ine_code, nombre, provincia, ccaa, cp_principal, poblacion) values
  ('42001', 'Abejar', 'Soria', 'Castilla y León', '42146', 287),
  ('42003', 'Adradas', 'Soria', 'Castilla y León', '42216', 65),
  ('42004', 'Ágreda', 'Soria', 'Castilla y León', '42100', 3133),
  ('42006', 'Alconaba', 'Soria', 'Castilla y León', '42133', 198),
  ('42007', 'Alcubilla de Avellaneda', 'Soria', 'Castilla y León', '42351', 111),
  ('42008', 'Alcubilla de las Peñas', 'Soria', 'Castilla y León', '42295', 61),
  ('42009', 'Aldealafuente', 'Soria', 'Castilla y León', '42135', 85),
  ('42010', 'Aldealices', 'Soria', 'Castilla y León', '42171', 22),
  ('42011', 'Aldealpozo', 'Soria', 'Castilla y León', '42111', 18),
  ('42012', 'Aldealseñor', 'Soria', 'Castilla y León', '42180', 29),
  ('42013', 'Aldehuela de Periáñez', 'Soria', 'Castilla y León', '42182', 27),
  ('42014', 'Aldehuelas, Las', 'Soria', 'Castilla y León', '42173', 58),
  ('42015', 'Alentisque', 'Soria', 'Castilla y León', '42225', 23),
  ('42016', 'Aliud', 'Soria', 'Castilla y León', '42129', 20),
  ('42017', 'Almajano', 'Soria', 'Castilla y León', '42180', 179),
  ('42018', 'Almaluez', 'Soria', 'Castilla y León', '42222', 113),
  ('42019', 'Almarza', 'Soria', 'Castilla y León', '42161', 601),
  ('42020', 'Almazán', 'Soria', 'Castilla y León', '42200', 5544),
  ('42021', 'Almazul', 'Soria', 'Castilla y León', '42126', 61),
  ('42022', 'Almenar de Soria', 'Soria', 'Castilla y León', '42130', 233),
  ('42023', 'Alpanseque', 'Soria', 'Castilla y León', '42213', 52),
  ('42024', 'Arancón', 'Soria', 'Castilla y León', '42111', 73),
  ('42025', 'Arcos de Jalón', 'Soria', 'Castilla y León', '42249', 1531),
  ('42026', 'Arenillas', 'Soria', 'Castilla y León', '42368', 29),
  ('42027', 'Arévalo de la Sierra', 'Soria', 'Castilla y León', '42161', 71),
  ('42028', 'Ausejo de la Sierra', 'Soria', 'Castilla y León', '42171', 113),
  ('42029', 'Baraona', 'Soria', 'Castilla y León', '42213', 117),
  ('42030', 'Barca', 'Soria', 'Castilla y León', '42210', 116),
  ('42031', 'Barcones', 'Soria', 'Castilla y León', '42368', 25),
  ('42032', 'Bayubas de Abajo', 'Soria', 'Castilla y León', '42366', 148),
  ('42033', 'Bayubas de Arriba', 'Soria', 'Castilla y León', '42366', 56),
  ('42034', 'Beratón', 'Soria', 'Castilla y León', '42107', 38),
  ('42035', 'Berlanga de Duero', 'Soria', 'Castilla y León', '42360', 810),
  ('42036', 'Blacos', 'Soria', 'Castilla y León', '42193', 36),
  ('42037', 'Bliecos', 'Soria', 'Castilla y León', '42128', 25),
  ('42038', 'Borjabad', 'Soria', 'Castilla y León', '42218', 29),
  ('42039', 'Borobia', 'Soria', 'Castilla y León', '42138', 218),
  ('42041', 'Buberos', 'Soria', 'Castilla y León', '42129', 27),
  ('42042', 'Buitrago', 'Soria', 'Castilla y León', '42162', 68),
  ('42043', 'Burgo de Osma-Ciudad de Osma', 'Soria', 'Castilla y León', '42195', 5283),
  ('42044', 'Cabrejas del Campo', 'Soria', 'Castilla y León', '42135', 48),
  ('42045', 'Cabrejas del Pinar', 'Soria', 'Castilla y León', '42146', 288),
  ('42046', 'Calatañazor', 'Soria', 'Castilla y León', '42193', 43),
  ('42048', 'Caltojar', 'Soria', 'Castilla y León', '42367', 53),
  ('42049', 'Candilichera', 'Soria', 'Castilla y León', '42134', 99),
  ('42050', 'Cañamaque', 'Soria', 'Castilla y León', '42220', 29),
  ('42051', 'Carabantes', 'Soria', 'Castilla y León', '42137', 21),
  ('42052', 'Caracena', 'Soria', 'Castilla y León', '42311', 13),
  ('42053', 'Carrascosa de Abajo', 'Soria', 'Castilla y León', '42311', 18),
  ('42054', 'Carrascosa de la Sierra', 'Soria', 'Castilla y León', '42180', 19),
  ('42055', 'Casarejos', 'Soria', 'Castilla y León', '42148', 145),
  ('42056', 'Castilfrío de la Sierra', 'Soria', 'Castilla y León', '42171', 35),
  ('42058', 'Castillejo de Robledo', 'Soria', 'Castilla y León', '42328', 100),
  ('42057', 'Castilruiz', 'Soria', 'Castilla y León', '42108', 170),
  ('42059', 'Centenera de Andaluz', 'Soria', 'Castilla y León', '42211', 19),
  ('42060', 'Cerbón', 'Soria', 'Castilla y León', '42175', 27),
  ('42061', 'Cidones', 'Soria', 'Castilla y León', '42145', 313),
  ('42062', 'Cigudosa', 'Soria', 'Castilla y León', '42114', 14),
  ('42063', 'Cihuela', 'Soria', 'Castilla y León', '42126', 35),
  ('42064', 'Ciria', 'Soria', 'Castilla y León', '42138', 67),
  ('42065', 'Cirujales del Río', 'Soria', 'Castilla y León', '42180', 21),
  ('42068', 'Coscurita', 'Soria', 'Castilla y León', '42216', 69),
  ('42069', 'Covaleda', 'Soria', 'Castilla y León', '42157', 1560),
  ('42070', 'Cubilla', 'Soria', 'Castilla y León', '42148', 22),
  ('42071', 'Cubo de la Solana', 'Soria', 'Castilla y León', '42191', 177),
  ('42073', 'Cueva de Ágreda', 'Soria', 'Castilla y León', '42107', 67),
  ('42075', 'Dévanos', 'Soria', 'Castilla y León', '42108', 72),
  ('42076', 'Deza', 'Soria', 'Castilla y León', '42125', 162),
  ('42078', 'Duruelo de la Sierra', 'Soria', 'Castilla y León', '42158', 1035),
  ('42079', 'Escobosa de Almazán', 'Soria', 'Castilla y León', '42224', 19),
  ('42080', 'Espeja de San Marcelino', 'Soria', 'Castilla y León', '42141', 160),
  ('42081', 'Espejón', 'Soria', 'Castilla y León', '42142', 122),
  ('42082', 'Estepa de San Juan', 'Soria', 'Castilla y León', '42171', 13),
  ('42083', 'Frechilla de Almazán', 'Soria', 'Castilla y León', '42215', 20),
  ('42084', 'Fresno de Caracena', 'Soria', 'Castilla y León', '42311', 16),
  ('42085', 'Fuentearmegil', 'Soria', 'Castilla y León', '42143', 148),
  ('42086', 'Fuentecambrón', 'Soria', 'Castilla y León', '42339', 29),
  ('42087', 'Fuentecantos', 'Soria', 'Castilla y León', '42162', 65),
  ('42088', 'Fuentelmonge', 'Soria', 'Castilla y León', '42124', 58),
  ('42089', 'Fuentelsaz de Soria', 'Soria', 'Castilla y León', '42162', 65),
  ('42090', 'Fuentepinilla', 'Soria', 'Castilla y León', '42293', 73),
  ('42092', 'Fuentes de Magaña', 'Soria', 'Castilla y León', '42181', 47),
  ('42093', 'Fuentestrún', 'Soria', 'Castilla y León', '42113', 55),
  ('42094', 'Garray', 'Soria', 'Castilla y León', '42162', 794),
  ('42095', 'Golmayo', 'Soria', 'Castilla y León', '42190', 3085),
  ('42096', 'Gómara', 'Soria', 'Castilla y León', '42120', 286),
  ('42097', 'Gormaz', 'Soria', 'Castilla y León', '42313', 18),
  ('42098', 'Herrera de Soria', 'Soria', 'Castilla y León', '42144', 12),
  ('42100', 'Hinojosa del Campo', 'Soria', 'Castilla y León', '42112', 24),
  ('42103', 'Langa de Duero', 'Soria', 'Castilla y León', '42320', 696),
  ('42105', 'Liceras', 'Soria', 'Castilla y León', '42341', 49),
  ('42106', 'Losilla, La', 'Soria', 'Castilla y León', '42181', 12),
  ('42107', 'Magaña', 'Soria', 'Castilla y León', '42181', 61),
  ('42108', 'Maján', 'Soria', 'Castilla y León', '42225', 10),
  ('42110', 'Matalebreras', 'Soria', 'Castilla y León', '42113', 81),
  ('42111', 'Matamala de Almazán', 'Soria', 'Castilla y León', '42211', 251),
  ('42113', 'Medinaceli', 'Soria', 'Castilla y León', '42230', 686),
  ('42115', 'Miño de Medinaceli', 'Soria', 'Castilla y León', '42230', 73),
  ('42116', 'Miño de San Esteban', 'Soria', 'Castilla y León', '42328', 43),
  ('42117', 'Molinos de Duero', 'Soria', 'Castilla y León', '42155', 162),
  ('42118', 'Momblona', 'Soria', 'Castilla y León', '42225', 19),
  ('42119', 'Monteagudo de las Vicarías', 'Soria', 'Castilla y León', '42220', 169),
  ('42120', 'Montejo de Tiermes', 'Soria', 'Castilla y León', '42311', 134),
  ('42121', 'Montenegro de Cameros', 'Soria', 'Castilla y León', '42127', 43),
  ('42123', 'Morón de Almazán', 'Soria', 'Castilla y León', '42216', 196),
  ('42124', 'Muriel de la Fuente', 'Soria', 'Castilla y León', '42193', 53),
  ('42125', 'Muriel Viejo', 'Soria', 'Castilla y León', '42148', 73),
  ('42127', 'Nafría de Ucero', 'Soria', 'Castilla y León', '42141', 35),
  ('42128', 'Narros', 'Soria', 'Castilla y León', '42189', 68),
  ('42129', 'Navaleno', 'Soria', 'Castilla y León', '42149', 698),
  ('42130', 'Nepas', 'Soria', 'Castilla y León', '42218', 49),
  ('42131', 'Nolay', 'Soria', 'Castilla y León', '42224', 45),
  ('42132', 'Noviercas', 'Soria', 'Castilla y León', '42124', 156),
  ('42134', 'Ólvega', 'Soria', 'Castilla y León', '42110', 3782),
  ('42135', 'Oncala', 'Soria', 'Castilla y León', '42172', 61),
  ('42139', 'Pinilla del Campo', 'Soria', 'Castilla y León', '42112', 17),
  ('42140', 'Portillo de Soria', 'Soria', 'Castilla y León', '42136', 11),
  ('42141', 'Póveda de Soria, La', 'Soria', 'Castilla y León', '42169', 108),
  ('42142', 'Pozalmuro', 'Soria', 'Castilla y León', '42112', 49),
  ('42144', 'Quintana Redonda', 'Soria', 'Castilla y León', '42291', 499),
  ('42145', 'Quintanas de Gormaz', 'Soria', 'Castilla y León', '42313', 119),
  ('42148', 'Quiñonería', 'Soria', 'Castilla y León', '42137', 10),
  ('42149', 'Rábanos, Los', 'Soria', 'Castilla y León', '42191', 470),
  ('42151', 'Rebollar', 'Soria', 'Castilla y León', '42165', 36),
  ('42152', 'Recuerda', 'Soria', 'Castilla y León', '42313', 61),
  ('42153', 'Rello', 'Soria', 'Castilla y León', '42368', 21),
  ('42154', 'Renieblas', 'Soria', 'Castilla y León', '42134', 107),
  ('42155', 'Retortillo de Soria', 'Soria', 'Castilla y León', '42315', 126),
  ('42156', 'Reznos', 'Soria', 'Castilla y León', '42137', 21),
  ('42157', 'Riba de Escalote, La', 'Soria', 'Castilla y León', '42368', 9),
  ('42158', 'Rioseco de Soria', 'Soria', 'Castilla y León', '42194', 123),
  ('42159', 'Rollamienta', 'Soria', 'Castilla y León', '42165', 49),
  ('42160', 'Royo, El', 'Soria', 'Castilla y León', '42153', 248),
  ('42161', 'Salduero', 'Soria', 'Castilla y León', '42156', 148),
  ('42162', 'San Esteban de Gormaz', 'Soria', 'Castilla y León', '42320', 2962),
  ('42163', 'San Felices', 'Soria', 'Castilla y León', '42114', 55),
  ('42164', 'San Leonardo de Yagüe', 'Soria', 'Castilla y León', '42140', 1954),
  ('42165', 'San Pedro Manrique', 'Soria', 'Castilla y León', '42174', 626),
  ('42166', 'Santa Cruz de Yanguas', 'Soria', 'Castilla y León', '42173', 56),
  ('42167', 'Santa María de Huerta', 'Soria', 'Castilla y León', '42260', 239),
  ('42168', 'Santa María de las Hoyas', 'Soria', 'Castilla y León', '42141', 112),
  ('42171', 'Serón de Nágima', 'Soria', 'Castilla y León', '42127', 125),
  ('42172', 'Soliedra', 'Soria', 'Castilla y León', '42224', 37),
  ('42173', 'Soria', 'Soria', 'Castilla y León', '42001', 41025),
  ('42174', 'Sotillo del Rincón', 'Soria', 'Castilla y León', '42165', 171),
  ('42175', 'Suellacabras', 'Soria', 'Castilla y León', '42189', 32),
  ('42176', 'Tajahuerce', 'Soria', 'Castilla y León', '42112', 22),
  ('42177', 'Tajueco', 'Soria', 'Castilla y León', '42366', 61),
  ('42178', 'Talveila', 'Soria', 'Castilla y León', '42148', 105),
  ('42181', 'Tardelcuende', 'Soria', 'Castilla y León', '42294', 414),
  ('42182', 'Taroda', 'Soria', 'Castilla y León', '42216', 45),
  ('42183', 'Tejado', 'Soria', 'Castilla y León', '42128', 100),
  ('42184', 'Torlengua', 'Soria', 'Castilla y León', '42124', 43),
  ('42185', 'Torreblacos', 'Soria', 'Castilla y León', '42193', 28),
  ('42187', 'Torrubia de Soria', 'Soria', 'Castilla y León', '42136', 52),
  ('42188', 'Trévago', 'Soria', 'Castilla y León', '42113', 47),
  ('42189', 'Ucero', 'Soria', 'Castilla y León', '42317', 80),
  ('42190', 'Vadillo', 'Soria', 'Castilla y León', '42144', 81),
  ('42191', 'Valdeavellano de Tera', 'Soria', 'Castilla y León', '42165', 222),
  ('42192', 'Valdegeña', 'Soria', 'Castilla y León', '42111', 36),
  ('42193', 'Valdelagua del Cerro', 'Soria', 'Castilla y León', '42113', 13),
  ('42194', 'Valdemaluque', 'Soria', 'Castilla y León', '42317', 139),
  ('42195', 'Valdenebro', 'Soria', 'Castilla y León', '42193', 85),
  ('42196', 'Valdeprado', 'Soria', 'Castilla y León', '42114', 8),
  ('42197', 'Valderrodilla', 'Soria', 'Castilla y León', '42293', 59),
  ('42198', 'Valtajeros', 'Soria', 'Castilla y León', '42181', 16),
  ('42200', 'Velamazán', 'Soria', 'Castilla y León', '42392', 66),
  ('42201', 'Velilla de la Sierra', 'Soria', 'Castilla y León', '42189', 26),
  ('42202', 'Velilla de los Ajos', 'Soria', 'Castilla y León', '42225', 15),
  ('42204', 'Viana de Duero', 'Soria', 'Castilla y León', '42218', 47),
  ('42205', 'Villaciervos', 'Soria', 'Castilla y León', '42192', 86),
  ('42206', 'Villanueva de Gormaz', 'Soria', 'Castilla y León', '42312', 6),
  ('42207', 'Villar del Ala', 'Soria', 'Castilla y León', '42165', 50),
  ('42208', 'Villar del Campo', 'Soria', 'Castilla y León', '42112', 29),
  ('42209', 'Villar del Río', 'Soria', 'Castilla y León', '42174', 155),
  ('42211', 'Villares de Soria, Los', 'Soria', 'Castilla y León', '42171', 72),
  ('42212', 'Villasayas', 'Soria', 'Castilla y León', '42214', 59),
  ('42213', 'Villaseca de Arciel', 'Soria', 'Castilla y León', '42129', 23),
  ('42215', 'Vinuesa', 'Soria', 'Castilla y León', '42150', 826),
  ('42216', 'Vizmanos', 'Soria', 'Castilla y León', '42173', 31),
  ('42217', 'Vozmediano', 'Soria', 'Castilla y León', '42109', 29),
  ('42218', 'Yanguas', 'Soria', 'Castilla y León', '42172', 104),
  ('42219', 'Yelo', 'Soria', 'Castilla y León', '42296', 40)
on conflict (ine_code) do update set nombre=excluded.nombre, provincia=excluded.provincia, ccaa=excluded.ccaa, cp_principal=excluded.cp_principal, poblacion=excluded.poblacion;

insert into ref_centros (codigo, nombre, ine_code, etapas) values
  ('42003670', 'MARGARITA DE FUENMAYOR', '42004', 'ESO, Bachillerato y FP (IES)'),
  ('42007249', 'MARÍA CORONEL Y ARANA', '42004', 'Educación Infantil'),
  ('42000048', 'SOR MARÍA DE JESÚS', '42004', 'Infantil y Primaria (CEIP)'),
  ('42003773', 'CRA EL VALLE', '42019', 'Infantil y Primaria (CRA)'),
  ('42007304', 'EL VALLE DE LOS PITUFOS', '42019', 'Educación Infantil'),
  ('42000322', 'ALMAZÁN', '42020', 'Formación Profesional (CIFP)'),
  ('42000292', 'CALASANCIO', '42020', 'Infantil, Primaria y Secundaria (concertado)'),
  ('42000280', 'DIEGO LAINEZ', '42020', 'Infantil y Primaria (CEIP)'),
  ('42004030', 'EL CAMINO', '42020', 'Personas Adultas'),
  ('42007274', 'EL LAGO', '42020', 'Educación Infantil'),
  ('42007134', 'ESCUELA DE MÚSICA DE ALMAZÁN', '42020', 'Música'),
  ('42003268', 'GAYA NUÑO', '42020', 'ESO, Bachillerato y FP (IES)'),
  ('42003712', 'CRA EL JALÓN', '42025', 'Infantil y Primaria (CRA)'),
  ('42000437', 'RIBERA DEL JALÓN', '42025', 'ESO, Bachillerato y FP (IES)'),
  ('42003839', 'CRA TIERRAS DE BERLANGA', '42035', 'Infantil y Primaria (CRA)'),
  ('42007389', 'LA RUEDA', '42043', 'Educación Infantil'),
  ('42000772', 'MANUEL RUIZ ZORRILLA', '42043', 'Infantil y Primaria (CEIP)'),
  ('42007444', 'PRINCESAS Y PIRATAS DEL BURGO', '42043', 'Educación Infantil'),
  ('42003761', 'SANTA CATALINA', '42043', 'ESO, Bachillerato y FP (IES)'),
  ('42000796', 'SEMINARIO SANTO DOMINGO DE GUZMÁN', '42043', 'Secundaria (privado)'),
  ('42003827', 'CRA PINARES SUR', '42055', 'Infantil y Primaria (CRA)'),
  ('42007328', 'LAS FUENTECILLAS', '42069', 'Educación Infantil'),
  ('42001089', 'MANUELA PEÑA', '42069', 'Infantil y Primaria (CEIP)'),
  ('42003682', 'PICOS DE URBIÓN', '42069', 'ESO, Bachillerato y FP (IES)'),
  ('42007158', 'ESCUELA DE MÚSICA DE DURUELO DE LA SIERRA', '42078', 'Música'),
  ('42001181', 'SANTO CRISTO DE LAS MARAVILLAS', '42078', 'Infantil y Primaria (CEIP)'),
  ('42007419', 'PEQUEÑOS NUMANTINOS', '42094', 'Educación Infantil'),
  ('42007237', 'ESCUELA DE MÚSICA DE GOLMAYO', '42095', 'Música'),
  ('42007201', 'GERARDO DIEGO', '42095', 'Infantil y Primaria (CEIP)'),
  ('42007262', 'LAS CAMARETAS', '42095', 'Educación Infantil'),
  ('42003803', 'CRA CAMPOS DE GÓMARA', '42096', 'Infantil y Primaria (CRA)'),
  ('42004005', 'CRA LA RIBERA', '42103', 'Infantil y Primaria (CRA)'),
  ('42007365', 'LANGA', '42103', 'Educación Infantil'),
  ('42007432', 'ESCUELA INFANTIL DE MEDINACELI', '42113', 'Educación Infantil'),
  ('42003840', 'CRA PINAR GRANDE', '42129', 'Infantil y Primaria (CRA)'),
  ('42004042', 'ARCO IRIS', '42134', 'Educación Infantil'),
  ('42003931', 'GUSTAVO ADOLFO BÉCQUER', '42134', 'Personas Adultas'),
  ('42004029', 'VILLA DEL MONCAYO', '42134', 'ESO, Bachillerato y FP (IES)'),
  ('42001909', 'VIRGEN DE OLMACEDO', '42134', 'Infantil y Primaria (CEIP)'),
  ('42003797', 'CRA RÍO IZANA', '42144', 'Infantil y Primaria (CRA)'),
  ('42004091', 'DOÑA JIMENA', '42162', 'Personas Adultas'),
  ('42007161', 'LA ALAMEDA', '42162', 'Educación Infantil'),
  ('42003700', 'LA RAMBLA', '42162', 'ESO, Bachillerato y FP (IES)'),
  ('42002331', 'VIRGEN DEL RIVERO', '42162', 'Infantil y Primaria (CEIP)'),
  ('42007146', 'ESCUELA DE MÚSICA DE SAN LEONARDO DE YAGÜE', '42164', 'Música'),
  ('42002422', 'Mª EUGENIA MARTÍNEZ DEL CAMPO', '42164', 'Infantil y Primaria (CEIP)'),
  ('42007250', 'PEQUELANDIA', '42164', 'Educación Infantil'),
  ('42003864', 'SAN LEONARDO', '42164', 'ESO, Bachillerato y FP (IES)'),
  ('42003785', 'CRA TIERRAS ALTAS', '42165', 'Infantil y Primaria (CRA)'),
  ('42007316', 'DINO', '42165', 'Educación Infantil'),
  ('42003505', 'ALFONSO X EL SABIO', '42173', 'Idiomas (EOI)'),
  ('42002690', 'ANTONIO MACHADO', '42173', 'ESO, Bachillerato y FP (IES)'),
  ('42007390', 'BABYS HOME', '42173', 'Educación Infantil'),
  ('42002707', 'CASTILLA', '42173', 'ESO, Bachillerato y FP (IES)'),
  ('42003347', 'CELTIBERIA', '42173', 'Personas Adultas'),
  ('42007331', 'CENETED', '42173', 'Enseñanzas Deportivas'),
  ('42007407', 'EIANDY PLANET', '42173', 'Educación Infantil'),
  ('42007377', 'EL OLMO', '42173', 'Educación Infantil'),
  ('42004066', 'EL TRÉBOL', '42173', 'Educación Infantil'),
  ('42002732', 'ESCUELA DE ARTE DE SORIA', '42173', 'Artísticas / Diseño'),
  ('42003414', 'FUENTE DEL REY', '42173', 'Infantil y Primaria (CEIP)'),
  ('42007353', 'GLORIA FUERTES', '42173', 'Educación Infantil'),
  ('42003451', 'INFANTES DE LARA', '42173', 'Infantil y Primaria (CEIP)'),
  ('42003244', 'LA ARBOLEDA', '42173', 'Infantil y Primaria (CEIP)'),
  ('42007195', 'LA MERCED', '42173', 'Formación Profesional (CIFP)'),
  ('42002719', 'LAS PEDRIZAS', '42173', 'Infantil y Primaria (CEIP)'),
  ('42002574', 'LOS DOCE LINAJES', '42173', 'Infantil y Primaria (CEIP)'),
  ('42002641', 'NUESTRA SEÑORA DEL PILAR', '42173', 'Infantil, Primaria y Secundaria (concertado)'),
  ('42002562', 'NUMANCIA', '42173', 'Infantil y Primaria (CEIP)'),
  ('42003499', 'ORESTE CAMARCA', '42173', 'Conservatorio de Música'),
  ('42007109', 'PARCHÍS', '42173', 'Educación Infantil'),
  ('42007213', 'PICO FRENTES', '42173', 'Formación Profesional (CIFP)'),
  ('42002720', 'POLITÉCNICO', '42173', 'ESO, Bachillerato y FP (IES)'),
  ('42007225', 'ROSA LEÓN', '42173', 'Educación Infantil'),
  ('42007420', 'ROYAL', '42173', 'Educación Infantil'),
  ('42003335', 'SANTA ISABEL', '42173', 'Educación Especial'),
  ('42002631', 'SANTA TERESA DE JESÚS', '42173', 'Infantil, Primaria y Secundaria (concertado)'),
  ('42002665', 'TRILEMA SORIA', '42173', 'Infantil, Primaria y Secundaria (concertado)'),
  ('42002744', 'VIRGEN DEL ESPINO', '42173', 'ESO, Bachillerato y FP (IES)'),
  ('42004078', 'VIRGEN DEL ESPINO (EI)', '42173', 'Educación Infantil'),
  ('42004081', 'VIRGEN DEL MIRÓN', '42173', 'Educación Infantil'),
  ('42003852', 'CRA PINARES ALTOS', '42215', 'Infantil y Primaria (CRA)'),
  ('42007110', 'PINARES', '42215', 'Personas Adultas'),
  ('42007341', 'VINUESA', '42215', 'Educación Infantil')
on conflict (codigo) do update set nombre=excluded.nombre, ine_code=excluded.ine_code, etapas=excluded.etapas;

-- ============================================================
-- ===== seed.sql =====
-- ============================================================

-- ============================================================
--  Pueblify · Datos de ejemplo (piloto Comarca del Moncayo, Soria)
--  Carga municipios, empresas y viviendas (no requieren auth.users).
--  Hogares y casos se crean desde la app una vez autenticado el técnico.
--  Requiere haber cargado antes el catálogo (seed_soria.sql) para el FK ine_code.
-- ============================================================

insert into municipalities (slug, nombre, provincia, poblacion_base, objetivo_nuevos, matricula_escolar, umbral_escolar, riesgo_despoblacion, cp, ine_code)
values
  ('olvega',  'Ólvega',  'Soria', 3782, 60, 380, 150, 'medio',   '42110', '42134'),
  ('agreda',  'Ágreda',  'Soria', 3133, 45, 300, 150, 'alto',    '42100', '42004'),
  ('borobia', 'Borobia', 'Soria',  218, 10,   8,  12, 'critico', '42138', '42039');

insert into companies (municipality_id, nombre, sector, vacantes, es_tractora, cp)
select id, 'Cárnicas del Moncayo', 'Agroalimentario', 18, true,  cp from municipalities where slug='olvega'
union all
select id, 'Maderas de Ágreda',    'Madera',           6, false, cp from municipalities where slug='agreda'
union all
select id, 'Quesería artesana de Borobia', 'Agroalimentario', 4, false, cp from municipalities where slug='borobia';

insert into properties (municipality_id, titulo, tipo, plazas, precio, estado, admite_mascotas)
select id, 'Piso reformado centro', 'piso'::tipo_vivienda, 4, 420, 'publicada'::estado_vivienda, true from municipalities where slug='olvega'
union all
select id, 'Casa con patio', 'casa'::tipo_vivienda, 5, 520, 'publicada'::estado_vivienda, true from municipalities where slug='olvega'
union all
select id, 'Casa de pueblo rehabilitada', 'casa'::tipo_vivienda, 5, 450, 'publicada'::estado_vivienda, true from municipalities where slug='agreda'
union all
select id, 'Casa con huerto', 'casa'::tipo_vivienda, 4, 300, 'publicada'::estado_vivienda, true from municipalities where slug='borobia';
