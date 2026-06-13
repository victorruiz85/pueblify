# Icon set de Pueblify

Set de iconos propio, **monoline / minimalista** (inspirado en Linear, Notion y Stripe),
con el mismo lenguaje visual que el logotipo.

**Especificaciones**
- `viewBox` 24×24
- trazo uniforme **2px**, `stroke-linecap="round"`, `stroke-linejoin="round"`
- sin relleno, sin sombras, sin degradados
- color de marca **#12312B** (los SVG sueltos lo llevan fijo; el sprite y el componente usan `currentColor` para poder tematizar)
- compatible en uso con Lucide y Heroicons (mismas convenciones)

## Iconos (23)

`hogar` · `caso` · `arraigo` · `habitantes-fijados` · `empadronamiento` · `asentado` ·
`proximo-paso` · `tarea` · `llamada` · `visita` · `nota` · `municipio` · `empresa` ·
`empleo` · `vivienda` · `familia` · `riesgo` · `atencion` · `correcto` ·
`indice-pueblify` · `retencion` · `crecimiento` · `impacto`

## Contenido

- `icons/<nombre>.svg` — 23 SVG independientes (color fijo #12312B).
- `icons/pueblify-icons.svg` — spritesheet con un `<symbol id="pf-<nombre>">` por icono (currentColor).
- `components/Icon.tsx` — componente React.
- `scripts/gen-icons.mjs` — generador (fuente única; reejecuta para regenerar todo).

## Uso

**1) Componente React (recomendado en la app)**

```tsx
import { Icon } from "@/components/Icon";

<Icon name="hogar" />                       // 24px, hereda el color del texto
<Icon name="riesgo" size={20} className="text-amber-600" />
<Icon name="indice-pueblify" color="#12312B" title="Índice Pueblify" />  // con título accesible
```

El color se controla con CSS (`color`/`className`) porque usa `currentColor`. Por defecto,
aplica el color de marca con `className="text-[#12312B]"` o define `--color` en tu tema.

**2) Spritesheet (HTML/no-React)**

Incluye el sprite una vez y referencia cada icono con `<use>`:

```html
<!-- una vez, al inicio del documento -->
<div hidden>/* aquí el contenido de icons/pueblify-icons.svg */</div>

<svg width="24" height="24"><use href="#pf-hogar" /></svg>
```

**3) SVG suelto**

```html
<img src="/icons/empadronamiento.svg" width="24" height="24" alt="Empadronamiento" />
```

## Regenerar

Si editas `scripts/gen-icons.mjs` (la fuente única), regenera todo con:

```bash
node scripts/gen-icons.mjs
```
