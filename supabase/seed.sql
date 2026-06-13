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
