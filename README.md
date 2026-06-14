# Pueblify — MVP (v1.2)

> **No es un portal inmobiliario.** Es la herramienta operativa de los técnicos de
> desarrollo rural **+** el panel de impacto para quien paga. Su tesis, en una frase:
> **convertimos empleo y vivienda en habitantes empadronados, y lo demostramos con datos.**

Este MVP implementa exactamente lo que la *Revisión estratégica v1.2* marcó como
imprescindible, y deja fuera lo que marcó como peligroso por complejidad (portal
público, motor de matching, doble CRM).

## Qué incluye

- **Panel de impacto** (`/`): North Star *habitantes fijados*, embudo de atracción,
  **Índice Pueblify** por municipio, brecha escolar y diagnóstico de fuga.
- **Tablero de casos** (`/casos`): 4 columnas (Interesado → En acompañamiento →
  Instalado → Asentado). Cada tarjeta es un hogar con su **Índice de Arraigo**,
  próximo hito y alertas. Se avanza con un clic; los hitos y las métricas se calculan solos.
- **Detalle de caso** (`/casos/[id]`): checklist de hitos, 7 señales de arraigo,
  desglose del Índice de Arraigo, confirmación de **empadronamiento** y baja con motivo.
- **Alta de hogar** (`/casos/nuevo`): formulario corto con React Hook Form + Zod.
- **Índices propietarios** (`lib/indices.ts`): Arraigo y Pueblify, por reglas simples (sin IA).
- **Migraciones SQL de producción** (`supabase/`): esquema, índices, RLS y funciones.

## Arrancar (sin configurar nada)

El MVP trae un **almacén en memoria sembrado con el piloto** (Comarca del Moncayo, Soria:
Ólvega, Ágreda y Borobia; empresa tractora *Cárnicas del Moncayo*, 16 hogares por las columnas). No necesitas
Supabase para verlo funcionar:

```bash
npm install --legacy-peer-deps
npm run dev
# abre http://localhost:3000  → te pedirá iniciar sesión
```

Acceso (demo): usuario `admin` o `tecnico`, contraseña `pueblify`
(configurables con `PUEBLIFY_ADMIN_PASSWORD` / `PUEBLIFY_TECNICO_PASSWORD`).

Tests:

```bash
npm test   # vitest: índices de arraigo/Pueblify y transiciones de estado
```

## Stack

Next.js 15 (App Router, Server Actions) · TypeScript · Tailwind CSS · React Hook Form ·
Zod · UI propia con patrón shadcn/ui. Preparado para Supabase/PostgreSQL y despliegue en Vercel.

## Conectar Supabase (arranque real)

1. Crea un proyecto en Supabase.
2. En el **SQL Editor**, ejecuta en orden: `supabase/migrations/0001_schema.sql` y luego
   `supabase/migrations/0002_indices_rls.sql`.
3. (Opcional) Carga catálogo de ejemplo con `supabase/seed.sql`.
4. Crea los usuarios de acceso en **Authentication → Users** (p. ej. `admin@tu-dominio` y
   `tecnico@tu-dominio`), inserta su fila en `profiles` con el rol adecuado
   (`administrador` / `agente_desarrollo`) y copia sus `id` (UUID).
5. Copia `.env.example` a `.env.local` y rellena:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   y `PUEBLIFY_ADMIN_PROFILE_ID` / `PUEBLIFY_TECNICO_PROFILE_ID` con los UUID del paso 4.
6. `npm run dev`. Con esas variables, la app usa **automáticamente** el adaptador de
   Supabase (`lib/data/supabase.ts`); sin ellas, sigue el almacén en memoria. La UI y las
   Server Actions no cambian.
7. Verifica la seguridad por rol ejecutando `supabase/rls_checks.sql` en el SQL Editor.

Atajo con la CLI: `./scripts/deploy-supabase.sh <PROJECT_REF>` (login + link + db push +
seed opcional + checks de RLS). Guía completa con checklist de validación y diagnóstico de
build en **`DESPLIEGUE.md`**. Qué clave usa cada operación (service role vs anon) y el
modelo de RLS: `supabase/ACCESO_Y_RLS.md`. La lógica de los índices vive también en SQL
(`calcular_arraigo`, vista `municipio_stats`), calculable en BBDD o en la app.

## Estructura

```
app/            Rutas (panel, tablero, detalle, alta)
components/     UI base + componentes de dominio (Arraigo, Pueblify, embudo, tablero)
lib/            types · store (memoria, seed) · indices · validators (Zod) · actions
supabase/       migraciones SQL (esquema + índices + RLS + funciones)
```

## Mapa con la estrategia v1.2

| Decisión v1.2 | Dónde está en el código |
|---|---|
| Relocation = caso simple de 4 estados + hitos auto | `lib/types.ts` (EstadoCaso, Hitos), `lib/store.ts` (alternarHito) |
| 7 señales de arraigo como checklist | `arraigo_signals`, `components/signals-editor.tsx` |
| Índice de Arraigo (predicción por reglas) | `lib/indices.ts` → `calcularArraigo` |
| Índice Pueblify (activo diferencial) | `lib/indices.ts` → `calcularPueblify`, `components/domain.tsx` |
| Panel del agente tipo Trello | `app/casos/page.tsx` + `components/case-card.tsx` |
| Empadronamiento como prueba | `components/case-actions.tsx`, `padron_records` |
| Privacidad: ayuntamiento ve agregados | RLS en `0002_indices_rls.sql` + vista `municipio_stats` |

## Correcciones aplicadas (v1.2.1)

- Capa de datos asíncrona con interfaz `Repo` (`lib/data/`): implementación en memoria
  por defecto y adaptador de Supabase (`lib/data/supabase.ts`) seleccionado por env.
- `asentado` e `instalado` son estados DERIVADOS del empadronamiento (`lib/transitions.ts`);
  no se pueden fijar a mano. El tablero solo permite mover entre interesado/acompañamiento.
- Un caso puede crearse sin municipio destino (se asigna después).
- Retención centralizada y corregida (`lib/retention.ts`): elegibles = empadronados ≥12 meses;
  si todavía no hay elegibles, el componente se excluye del Índice Pueblify en vez de inventarse.
- Autenticación mínima admin/técnico (cookie de sesión + middleware). Sustituible por Supabase Auth.
- Tests con Vitest (`tests/`): índices y transiciones de estado.

## Diferido (no MVP, por diseño)

Pagos · matching automático · mapas · firma digital · portal público de doble cara ·
multi-tenant. Cada uno tiene su punto de anclaje previsto en el modelo de datos.
