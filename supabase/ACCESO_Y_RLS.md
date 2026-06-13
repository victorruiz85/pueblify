# Acceso a datos: service role vs anon key, y RLS

Pueblify usa **dos claves** de Supabase con propósitos distintos. La regla es simple:

- **anon key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`): pública, segura para el navegador. Cliente `supabaseAnon()`. **Respeta RLS.** Se usa solo para el **catálogo público**.
- **service role** (`SUPABASE_SERVICE_ROLE_KEY`): secreta, **solo servidor**, nunca llega al navegador. Cliente `supabaseService()`. **Omite RLS.** Se usa para datos **operativos/personales** (hogares, casos, padrón) y para **todas las escrituras**, desde la capa de datos de confianza (`lib/data/supabase.ts`), después de que la app haya autenticado al usuario.

> Las escrituras fijan `lead_profile_id` y `agent_id` a partir del **usuario autenticado** (no se confía en el cliente), de modo que el dato de "quién creó/tutela" es fiable aunque la operación use service role.

## Qué operación usa qué clave

| Operación (`Repo`)                | Tablas                                  | Cliente            | Clave         |
|-----------------------------------|-----------------------------------------|--------------------|---------------|
| `getMunicipios` / `getMunicipio`  | `municipalities`                        | `supabaseAnon()`   | **anon**      |
| `getEmpresas` / `getEmpresa`      | `companies`                             | `supabaseAnon()`   | **anon**      |
| `getViviendas`                    | `properties`                            | `supabaseService()`| **service**¹  |
| `getCasos` / `getCaso`            | `relocations`, `padron_records`         | `supabaseService()`| **service**   |
| `getHogar`                        | `households`, `members`, `signals`      | `supabaseService()`| **service**   |
| `crearHogarYCaso`                 | `households`, `members`, `signals`, `relocations` | `supabaseService()` | **service** |
| `moverCaso` / `alternarHito`      | `relocations`                           | `supabaseService()`| **service**   |
| `registrarEmpadronamiento`        | `padron_records`, `relocations`         | `supabaseService()`| **service**   |
| `actualizarSenal` / `asignarVivienda` / `darDeBaja` | `arraigo_signals`, `relocations` | `supabaseService()` | **service** |

¹ `getViviendas` usa service role a propósito: la app operativa necesita ver también
viviendas no publicadas (reservadas/alquiladas) asignadas a un caso, que la RLS de
`properties` ocultaría a la clave anónima.

## RLS (defensa en profundidad)

Aunque la capa de datos del servidor sea de confianza, **RLS es la última barrera**:
si alguien usara la clave anónima directamente, solo vería el catálogo público y nunca
hogares ni casos. Principio clave: **el ayuntamiento ve agregados, no personas.**

Verifica la RLS por rol ejecutando `supabase/rls_checks.sql` en el SQL Editor: simula
técnico A/B, administrador y anónimo y comprueba el acceso esperado. Hace `ROLLBACK` al final.
