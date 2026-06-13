# Pueblify — Demo navegable (modo en memoria)

Demo interactiva **sin Supabase**: arranca con datos del piloto ya cargados en memoria
(comarca de Sangüesa, empresa tractora, ~16 hogares por las 4 columnas del tablero).
Ideal para ver y probar la herramienta de principio a fin.

> Modo demo = no hay variables de Supabase en el entorno. La barra lateral muestra el
> distintivo **"● Modo demo · datos en memoria"**. Los cambios viven mientras el servidor
> esté en marcha; al reiniciar, vuelve al estado sembrado.

## 1. Instalar

```bash
unzip pueblify-mvp.zip
cd pueblify-mvp
npm install --legacy-peer-deps
```

Requisitos: Node 18.18+ (recomendado Node 20/22). No hace falta `.env` para la demo.

## 2. Arrancar

Desarrollo (recomendado para la demo):

```bash
npm run dev
# abre http://localhost:3000
```

Producción local (opcional, comprueba el build):

```bash
npm run build && npm start
# abre http://localhost:3000
```

## 3. Usuario y contraseña

| Usuario   | Contraseña | Rol           |
|-----------|------------|---------------|
| `tecnico` | `pueblify` | Técnico (uso diario) |
| `admin`   | `pueblify` | Administrador |

(Configurables con `PUEBLIFY_TECNICO_PASSWORD` / `PUEBLIFY_ADMIN_PASSWORD`.)

## 4. Rutas principales

| Ruta              | Qué es |
|-------------------|--------|
| `/login`          | Inicio de sesión |
| `/`               | Panel de impacto (KPIs, Índice Pueblify, embudo, ayuda de indicadores) |
| `/casos`          | Tablero de casos (4 columnas) |
| `/casos/nuevo`    | Alta de hogar (abre un caso) |
| `/casos/[id]`     | Detalle del caso (hitos, señales, empadronamiento, baja) |

Botón **"＋ Nuevo hogar"** visible en el dashboard y en el tablero.
En el dashboard, despliega **"ⓘ ¿Qué significan estos indicadores?"** para ver las
definiciones de Índice de Arraigo, Índice Pueblify, habitantes fijados e Instalado/Asentado.

## 5. Flujo recomendado de prueba

1. **Login.** Abre `http://localhost:3000` → te lleva a `/login`. Entra con `tecnico` / `pueblify`.
2. **Dashboard.** En `/` fíjate en "Habitantes fijados", "Menores incorporados", "Retención 12m",
   el Índice Pueblify por municipio y el embudo. Despliega el bloque de ayuda ⓘ.
3. **Tablero.** Pulsa "Tablero de casos". Verás las columnas *Interesado · En acompañamiento ·
   Instalado · Asentado* con tarjetas (cada una con su Índice de Arraigo y alertas).
4. **Crear nuevo hogar.** "＋ Nuevo hogar" → rellena contacto y nº de personas, deja el
   municipio en "Sin asignar" si quieres, marca alguna señal de arraigo → "Crear hogar y abrir
   caso". Se abre el detalle en estado **Interesado**.
5. **Marcar hitos.** En el detalle, marca en "Hitos del caso": *Vivienda asignada*, *Empleo
   resuelto*, etc. Observa cómo sube el **Índice de Arraigo** y, al marcar el primer
   habilitador, el caso pasa a **En acompañamiento**.
6. **Confirmar empadronamiento.** En "Empadronamiento" pon personas/menores y fecha →
   "Confirmar empadronamiento". El caso pasa a **Instalado** y aparece "Empadronado el…".
7. **Registrar una baja.** (Puedes usar otro caso ya instalado, p. ej. *Familia López Arce*.)
   En "Zona de riesgo" → "Registrar baja" → elige un motivo (p. ej. *servicios*) → "Confirmar".
8. **Comprobar el dashboard.** Vuelve a `/`:
   - "Habitantes fijados" y "Hogares reubicados" suben tras el empadronamiento del paso 6.
   - La baja del paso 7 aparece en "Diagnóstico de fuga (motivos de baja)" y en "Bajas".
   - El Índice Pueblify del municipio afectado se recalcula.

### Notas de comportamiento (esperado, no son errores)

- **"Asentado" no se marca a mano:** las columnas Instalado/Asentado son automáticas. Un caso
  llega a *Instalado* al empadronarse y a *Asentado* al cumplir 12 meses empadronado.
- **Retención 12m** muestra "—" si todavía no hay casos con 12+ meses; en el seed sí los hay.
- Al **reiniciar** el servidor, los datos vuelven al estado sembrado (es una demo en memoria).

## 6. Solución de problemas

- **El puerto 3000 está ocupado:** `npm run dev -- -p 3001` y abre `http://localhost:3001`.
- **`npm install` falla por peers:** usa `npm install --legacy-peer-deps` (como arriba).
- **Quiero datos limpios:** reinicia el servidor (`Ctrl+C` y `npm run dev`).
- **Conectar Supabase real (no necesario para la demo):** ver `DESPLIEGUE.md`.
