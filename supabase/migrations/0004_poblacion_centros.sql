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
