# Despliegue de Pueblify (Supabase + Vercel)

Guía operativa. No introduce funcionalidades: aplica el esquema, conecta el entorno y valida.

## 0. Prerrequisitos

- Node 18+ y el proyecto instalado (`npm install --legacy-peer-deps`).
- Supabase CLI: `npm i -g supabase` (o `brew install supabase/tap/supabase`). Verifica con `supabase --version`.
- Un proyecto creado en [app.supabase.com] **en región UE** (Fráncfort/Irlanda — requisito de
  protección de datos, ver `PRIVACIDAD.md`) y su **PROJECT_REF** (Project Settings → General).

## 1. Variables de entorno (`.env.local`)

Copia `.env.example` a `.env.local` y rellena (Dashboard → Project Settings → API / Database):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...        # anon (pública)
SUPABASE_SERVICE_ROLE_KEY=eyJ...            # service role (SECRETA, solo servidor)

PUEBLIFY_ADMIN_PASSWORD=cambia-esto
PUEBLIFY_TECNICO_PASSWORD=cambia-esto
PUEBLIFY_ADMIN_PROFILE_ID=                  # UUID de profiles (paso 4)
PUEBLIFY_TECNICO_PROFILE_ID=                # UUID de profiles (paso 4)
```

Sin estas variables, la app sigue funcionando con el almacén en memoria (demo).

## 2. Aplicar el esquema con la CLI

Opción A — script asistido:

```bash
chmod +x scripts/deploy-supabase.sh
./scripts/deploy-supabase.sh <PROJECT_REF>
```

Opción B — comandos manuales:

```bash
supabase login                              # abre el navegador y pega el token
supabase link --project-ref <PROJECT_REF>   # vincula el repo con el proyecto remoto
supabase db push                            # aplica TODAS las migraciones (0001 … 0005)
```

> Incluye: esquema (0001), índices+RLS (0002), catálogo de municipios (0003),
> población+centros educativos (0004) y consentimiento RGPD (0005). Protección de datos: ver `PRIVACIDAD.md`.

> Si `db push` se queja del formato de versión de los archivos `0001_/0002_`, pega su
> contenido directamente en el SQL Editor en ese orden (mismo resultado).

## 3. Seed opcional (catálogo de ejemplo)

```bash
supabase db push --include-seed
# o, con la cadena de conexión (Project Settings → Database → Connection string):
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

Carga municipios, empresas y viviendas de ejemplo. Los hogares y casos se crean desde la app.

## 3.bis Catálogo oficial de municipios (provincia → pueblo → CP)

La migración `0003_ref_municipios.sql` crea `ref_municipios` y `ref_codigos_postales`
(solo lectura). Cárgalas con el importador, que toma los datos de fuentes oficiales/abiertas
(INE para municipios; dataset de CP enlazado por código INE). Descarga los CSV y pásalos:

```bash
node scripts/import-municipios.mjs \
  --muni ./municipios.csv \
  --cp ./codigos_postales.csv \
  --pob ./poblacion_ine.csv \
  --centros ./centros_educativos.csv
```

Cada fichero es opcional salvo `--muni`. Lo que carga cada uno (migraciones 0003 y 0004):
- `--muni`: municipios + provincia + código INE → `ref_municipios`.
- `--cp`: códigos postales ↔ código INE → `ref_codigos_postales` (un municipio puede tener varios CP).
- `--pob`: población oficial (Padrón del INE) → `ref_municipios.poblacion` (autocompleta `poblacion_base`).
- `--centros`: Registro de Centros del Ministerio de Educación → `ref_centros` (saber si el municipio tiene colegio y de qué etapas; alimenta la vista `municipio_escolarizacion`).

Fuentes recomendadas (ver cabecera del script): INE «Relación de municipios y sus códigos por
provincias» y Padrón; `codeforspain/ds-organizacion-administrativa`; `inigoflores/ds-codigos-postales-ine-es`;
y el Registro Estatal de Centros Docentes (Ministerio de Educación). El panel de admin usa estas tablas para
provincia → municipio (CP y población autorrellenados) y para mostrar el colegio del municipio.

## 4. Crear usuarios y perfiles

1. Authentication → Users → crea `admin@tu-dominio` y `tecnico@tu-dominio`.
2. En el SQL Editor, inserta su perfil y copia el `id`:

```sql
insert into profiles (id, role, full_name, email)
values
  ('<UUID-del-admin>',   'administrador',     'Administrador', 'admin@tu-dominio'),
  ('<UUID-del-tecnico>', 'agente_desarrollo', 'Marta Iribarren', 'tecnico@tu-dominio');
```

3. Pega esos UUID en `PUEBLIFY_ADMIN_PROFILE_ID` y `PUEBLIFY_TECNICO_PROFILE_ID`.

## 5. Verificar RLS por rol

```bash
psql "$SUPABASE_DB_URL" -f supabase/rls_checks.sql
# o pega supabase/rls_checks.sql en el SQL Editor → Run
```

Debe imprimir varios `OK ·` y terminar en `✔ TODOS LOS CHECKS DE RLS PASARON` (hace ROLLBACK).
Detalle de qué clave usa cada operación: `supabase/ACCESO_Y_RLS.md`.

## 6. Desplegar en Vercel

1. Importa el repo en Vercel (framework: Next.js, sin overrides).
2. Project Settings → Environment Variables: añade **las mismas** del paso 1
   (marca `SUPABASE_SERVICE_ROLE_KEY` solo para *Production*/*Preview*, nunca expuesta al cliente).
3. Deploy.

---

## 7. Checklist funcional (validación end-to-end)

Tras `npm run dev` (local) o el deploy (Vercel), inicia sesión y recorre:

- [ ] **Login.** Ir a `/` sin sesión → redirige a `/login`. Entrar como `tecnico` →
      vuelve a `/` y la barra lateral muestra el usuario y "Salir".
- [ ] **Crear caso.** `Nuevo hogar` → rellenar contacto, nº personas, dejar municipio
      "Sin asignar" (debe permitirlo) → "Crear hogar y abrir caso" → abre el detalle en
      estado **Interesado**. (En Supabase: `households.lead_profile_id` y
      `relocations.agent_id` quedan con el UUID del técnico logado.)
- [ ] **Empadronamiento.** En el detalle, rellenar "Empadronamiento" (personas, menores,
      fecha) → Confirmar → el caso pasa a **Instalado** y aparece la insignia "Empadronado el…".
      (Reenviarlo no duplica: `unique(relocation_id)` + upsert.)
- [ ] **Baja.** En "Zona de riesgo" → Registrar baja → elegir motivo → Confirmar → el caso
      sale del tablero y el dashboard lo cuenta en "Diagnóstico de fuga".
- [ ] **Dashboard.** En `/` comprobar que "Habitantes fijados", "Menores incorporados",
      el **Índice Pueblify** por municipio, el embudo y "Retención 12m" reflejan los cambios.
      (La retención solo cuenta empadronados con ≥12 meses; si no hay, muestra "—".)
- [ ] **Estado automático.** En el tablero, un caso Instalado/Asentado no tiene botones de
      mover ("Estado automático"): no se puede fijar "asentado" a mano.

---

## 8. `next build` se queda en "Collecting page data"

Esa fase ejecuta los módulos de cada página para recopilar metadatos. Se **cuelga** cuando,
durante el build, algún módulo hace una operación bloqueante (conexión a BBDD/red sin
timeout, `await` de nivel superior, o el render estático de una página que llama a datos).

Cómo lo evita este proyecto:

- Todas las páginas con datos declaran `export const dynamic = "force-dynamic"`, así que no
  se prerenderizan en build (se sirven por petición).
- El cliente de Supabase se crea de forma perezosa y `getRepo()` solo se llama dentro de
  Server Components/Actions, **nunca al importar el módulo**. Por eso `next build` no abre
  conexiones durante "Collecting page data".

Si vuelve a colgarse, comprueba en este orden:

1. **Qué ruta lo provoca:** ejecuta `next build` en local con las mismas variables; Next
   imprime las rutas a medida que las recopila. La última que aparece antes del cuelgue es
   la culpable.
2. **Imports con efectos secundarios:** que ningún módulo abra conexiones o haga `fetch`
   a nivel superior. Mueve esas llamadas dentro de funciones que se ejecuten por petición.
3. **Rutas que deberían ser dinámicas:** añade `export const dynamic = "force-dynamic"`
   (o `export const revalidate = 0`) a cualquier página que lea datos.
4. **Egress de red en CI:** si una llamada en build apunta a un host inalcanzable, se queda
   esperando. Evita llamar a Supabase en build.

### Comprobarlo en Vercel

- **Build Logs:** Deployment → pestaña *Building*. Verás la misma línea "Collecting page
  data"; si no avanza, el build agotará el tiempo (límite de Vercel) y fallará ahí.
- **Reproducir el build de Vercel en local:** con la Vercel CLI,
  `vercel pull --environment=preview` (trae las env) y luego `vercel build`. Reproduce el
  entorno y las variables exactas del deploy, que es la causa habitual (una env presente en
  Vercel pero ausente en local cambia el comportamiento del build).
- **Revisar variables:** Project Settings → Environment Variables. Una `NEXT_PUBLIC_SUPABASE_URL`
  presente pero incorrecta no rompe el build de este proyecto (no se usa en build), pero sí
  rompería si alguna página dejara de ser dinámica: mantenlas `force-dynamic`.
