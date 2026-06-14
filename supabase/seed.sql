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
