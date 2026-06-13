# Flujo de jornada del técnico de desarrollo rural

La herramienta está organizada en torno al trabajo diario del técnico: el **Tablero
("Mi jornada", `/`)** es la pantalla principal y el **Panel de impacto (`/dashboard`)** es
secundario, para reporting. Todo lo que sigue se apoya en datos ya existentes (hitos,
padrón, fechas); no hay entidades nuevas.

## La jornada, paso a paso

1. **Inicio del día — "Mi jornada" (`/`).**
   Al iniciar sesión, el técnico aterriza en su puesto. Arriba ve tres bloques:
   - **Tareas pendientes:** hitos vencidos, menores sin matricular, casos estancados
     (>21 días sin avance) y checkpoints de retención pendientes. Cada tarea enlaza al caso.
   - **Próximos hitos (14 días):** lo que toca hacer, ordenado por fecha.
   - **Resumen semanal de impacto:** hogares nuevos, empadronamientos, personas fijadas,
     hitos completados y bajas de los últimos 7 días.
   Con eso planifica el día.

2. **Revisar la cartera — Tablero de casos.**
   Debajo, las cuatro columnas (*Interesado · En acompañamiento · Instalado · Asentado*).
   Cada tarjeta muestra el hogar, su **Índice de Arraigo** y alertas. El técnico prioriza
   por las tareas y por los casos "Frágil/En riesgo".

3. **Captar — Nuevo hogar.**
   Botón **＋ Nuevo hogar** (visible en el tablero y en el panel). Alta corta: contacto,
   tamaño, origen, señales de arraigo. El caso se abre en **Interesado**.

4. **Acompañar — Detalle del caso (`/casos/[id]`).**
   El técnico trabaja los habilitadores marcando **hitos** (vivienda, empleo, empleo de la
   pareja, matrícula de menores, mudanza), ajusta las **señales de arraigo** y revisa la
   **Cronología del caso** (timeline con todo lo ocurrido). El Índice de Arraigo se
   recalcula solo; al marcar el primer habilitador, el caso pasa a *En acompañamiento*.

5. **Instalar — Empadronamiento.**
   Cuando el hogar se muda y empadrona, el técnico confirma el **empadronamiento**
   (personas, menores, fecha). El caso pasa a **Instalado** automáticamente y cuenta como
   habitantes fijados.

6. **Gestionar el riesgo — Baja.**
   Si un hogar se marcha, registra la **baja** con su motivo. Alimenta el diagnóstico de fuga.

7. **Cierre y reporting — Panel de impacto (`/dashboard`).**
   De forma puntual (p. ej. semanal o ante el GAL/ayuntamiento), abre el panel secundario:
   habitantes fijados, **Índice Pueblify** por municipio, embudo de atracción, brecha
   escolar y motivos de baja. Es la vista de dirección, no la de trabajo diario.

## Mapa pantalla ↔ paso

| Paso de la jornada            | Dónde |
|-------------------------------|-------|
| Planificar el día             | `/` · bloque "Mi jornada" |
| Trabajar la cartera           | `/` · tablero de 4 columnas |
| Dar de alta un hogar          | `/casos/nuevo` |
| Acompañar (hitos, señales, timeline) | `/casos/[id]` |
| Confirmar empadronamiento     | `/casos/[id]` · Empadronamiento |
| Registrar baja                | `/casos/[id]` · Zona de riesgo |
| Reporting de impacto          | `/dashboard` |

## Estados (recordatorio)

*Interesado* y *En acompañamiento* los gestiona el técnico. *Instalado* (empadronado) y
*Asentado* (≥12 meses) se **calculan solos**; no se marcan a mano.
