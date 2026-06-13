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
