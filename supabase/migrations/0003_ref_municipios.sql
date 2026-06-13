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
