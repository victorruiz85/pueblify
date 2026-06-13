-- ============================================================
--  Pueblify · Datos de ejemplo (piloto comarca de Sangüesa)
--  Carga municipios, empresas y viviendas (no requieren auth.users).
--  Hogares y casos se crean desde la app una vez autenticado el técnico.
-- ============================================================

insert into municipalities (slug, nombre, provincia, poblacion_base, objetivo_nuevos, matricula_escolar, umbral_escolar, riesgo_despoblacion)
values
  ('sanguesa', 'Sangüesa', 'Navarra', 5040, 60, 182, 150, 'medio'),
  ('lumbier',  'Lumbier',  'Navarra', 1410, 30,  96, 105, 'alto'),
  ('aibar',    'Aibar',    'Navarra',  790, 18,  41,  45, 'critico');

insert into companies (municipality_id, nombre, sector, vacantes, es_tractora)
select id, 'Conservas del Pirineo', 'Agroalimentario', 18, true  from municipalities where slug='sanguesa'
union all
select id, 'Aserradero de Lumbier',  'Madera',          6, false from municipalities where slug='lumbier'
union all
select id, 'Residencia Santa Eufemia','Sociosanitario', 4, false from municipalities where slug='aibar';

insert into properties (municipality_id, titulo, tipo, plazas, precio, estado, admite_mascotas)
select id, 'Piso reformado centro', 'piso', 4, 480, 'publicada', true from municipalities where slug='sanguesa'
union all
select id, 'Casa con patio', 'casa', 5, 600, 'publicada', true from municipalities where slug='sanguesa'
union all
select id, 'Casa de pueblo rehabilitada', 'casa', 5, 520, 'publicada', true from municipalities where slug='lumbier'
union all
select id, 'Casa con huerto', 'casa', 4, 380, 'publicada', true from municipalities where slug='aibar';
