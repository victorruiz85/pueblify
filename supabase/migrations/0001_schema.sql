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
