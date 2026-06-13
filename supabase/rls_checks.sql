-- ============================================================
--  Pueblify · Verificación manual de RLS por rol
-- ============================================================
--  Cómo ejecutarlo:
--    Supabase → SQL Editor → pega este archivo → Run.
--    (El SQL Editor corre como superusuario, que OMITE RLS; por eso el script
--     baja a los roles `authenticated`/`anon` con SET LOCAL ROLE para que la RLS
--     SÍ se aplique, simulando a cada usuario vía request.jwt.claims.)
--
--  Crea datos temporales y hace ROLLBACK al final: no deja rastro.
--  Si algún check falla, lanza EXCEPTION; si todo va bien, verás los NOTICE "OK".
-- ============================================================

begin;

do $$
declare
  u_admin uuid := gen_random_uuid();
  u_a     uuid := gen_random_uuid();
  u_b     uuid := gen_random_uuid();
  h_a uuid; h_b uuid; r_a uuid; r_b uuid;
  n int;
begin
  -- Usuarios de auth + perfiles
  insert into auth.users (instance_id, id, aud, role, email, created_at, updated_at) values
    ('00000000-0000-0000-0000-000000000000', u_admin, 'authenticated', 'authenticated', 'admin@test.local', now(), now()),
    ('00000000-0000-0000-0000-000000000000', u_a,     'authenticated', 'authenticated', 'tecnicoa@test.local', now(), now()),
    ('00000000-0000-0000-0000-000000000000', u_b,     'authenticated', 'authenticated', 'tecnicob@test.local', now(), now());

  insert into profiles (id, role, full_name, email) values
    (u_admin, 'administrador',     'Admin Test',   'admin@test.local'),
    (u_a,     'agente_desarrollo', 'Tecnico A',    'tecnicoa@test.local'),
    (u_b,     'agente_desarrollo', 'Tecnico B',    'tecnicob@test.local');

  insert into municipalities (slug, nombre, provincia) values ('t-muni-rls', 'Test RLS', 'X');

  insert into households (lead_profile_id, contacto, tamano) values (u_a, 'Hogar A', 1) returning id into h_a;
  insert into households (lead_profile_id, contacto, tamano) values (u_b, 'Hogar B', 1) returning id into h_b;
  insert into relocations (household_id, agent_id, estado, canal) values (h_a, u_a, 'interesado', 'gal') returning id into r_a;
  insert into relocations (household_id, agent_id, estado, canal) values (h_b, u_b, 'interesado', 'gal') returning id into r_b;

  --------------------------------------------------------------------
  -- Check 1 · El técnico A ve SU caso pero no el de B
  --------------------------------------------------------------------
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', u_a::text, 'role', 'authenticated')::text, true);
  select count(*) into n from relocations where id = r_a;
  if n <> 1 then raise exception 'FALLO: el técnico A no ve su propio caso (n=%)', n; end if;
  select count(*) into n from relocations where id = r_b;
  if n <> 0 then raise exception 'FALLO: el técnico A ve el caso del técnico B'; end if;
  raise notice 'OK · técnico A ve el suyo y no el de B';

  --------------------------------------------------------------------
  -- Check 2 · El técnico B no ve el caso de A (simétrico)
  --------------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', u_b::text, 'role', 'authenticated')::text, true);
  select count(*) into n from relocations where id = r_a;
  if n <> 0 then raise exception 'FALLO: el técnico B ve el caso del técnico A'; end if;
  raise notice 'OK · técnico B no ve el caso de A';

  --------------------------------------------------------------------
  -- Check 3 · El administrador ve TODOS los casos
  --------------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', u_admin::text, 'role', 'authenticated')::text, true);
  select count(*) into n from relocations where id in (r_a, r_b);
  if n <> 2 then raise exception 'FALLO: el administrador no ve todos los casos (n=%)', n; end if;
  raise notice 'OK · administrador ve todos los casos';

  --------------------------------------------------------------------
  -- Check 4 · El anónimo NO ve casos (datos personales)
  --------------------------------------------------------------------
  reset role;
  set local role anon;
  perform set_config('request.jwt.claims', NULL, true);
  select count(*) into n from relocations where id in (r_a, r_b);
  if n <> 0 then raise exception 'FALLO: un anónimo ve casos de reubicación'; end if;
  raise notice 'OK · anónimo no ve casos';

  --------------------------------------------------------------------
  -- Check 5 · El anónimo SÍ ve el catálogo público de municipios
  --------------------------------------------------------------------
  select count(*) into n from municipalities where slug = 't-muni-rls';
  if n <> 1 then raise exception 'FALLO: un anónimo no ve el catálogo de municipios'; end if;
  raise notice 'OK · anónimo ve el catálogo de municipios';

  reset role;
  raise notice '✔ TODOS LOS CHECKS DE RLS PASARON';
end $$;

rollback;
