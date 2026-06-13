// ============================================================
//  Pueblify · Importador del catálogo OFICIAL de municipios + CP
// ============================================================
//  Carga ref_municipios (INE) y ref_codigos_postales en Supabase.
//  NO inventa datos: los toma de fuentes oficiales/abiertas.
//
//  Requisitos:
//    - Node 18+ (usa fetch nativo)
//    - npm i (el proyecto ya incluye @supabase/supabase-js)
//    - Variables de entorno:
//        NEXT_PUBLIC_SUPABASE_URL
//        SUPABASE_SERVICE_ROLE_KEY   (secreta; solo servidor)
//
//  Uso:
//    node scripts/import-municipios.mjs
//    node scripts/import-municipios.mjs --muni ./municipios.csv --cp ./cp.csv
//
//  Fuentes recomendadas (descárgalas y pásalas con --muni/--cp, o ajusta las URLs):
//    Municipios + provincia + código INE:
//      INE: https://www.ine.es  (Relación de municipios y sus códigos por provincias)
//      o   https://github.com/codeforspain/ds-organizacion-administrativa
//    Códigos postales ↔ código INE:
//          https://github.com/inigoflores/ds-codigos-postales-ine-es
//
//  El parser mapea columnas por nombre de cabecera (tolerante a variantes);
//  revisa MAP si tu CSV usa otros nombres.
// ============================================================

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const arg = (k) => {
  const i = process.argv.indexOf(k);
  return i >= 0 ? process.argv[i + 1] : null;
};

// Ajusta estas URLs a los CSV oficiales que vayas a usar (o pasa ficheros locales).
const MUNI_SRC = arg("--muni") ?? process.env.MUNI_CSV_URL ?? "";
const CP_SRC = arg("--cp") ?? process.env.CP_CSV_URL ?? "";
const POB_SRC = arg("--pob") ?? process.env.POB_CSV_URL ?? ""; // población INE (ine_code,poblacion)
const CENTROS_SRC = arg("--centros") ?? process.env.CENTROS_CSV_URL ?? ""; // centros educativos

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
if (!MUNI_SRC) {
  console.error("Indica el CSV de municipios con --muni <ruta|url> (ver cabecera del script).");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

// --- Utilidades ---
async function leer(src) {
  if (/^https?:\/\//.test(src)) {
    const r = await fetch(src);
    if (!r.ok) throw new Error(`No se pudo descargar ${src} (${r.status})`);
    return await r.text();
  }
  return readFileSync(src, "utf8");
}
function parseCSV(txt) {
  const delim = (txt.split("\n")[0].match(/;/g) || []).length > (txt.split("\n")[0].match(/,/g) || []).length ? ";" : ",";
  const lines = txt.trim().split(/\r?\n/);
  const head = lines[0].split(delim).map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
  return lines.slice(1).map((l) => {
    const cols = l.split(delim).map((c) => c.trim().replace(/^"|"$/g, ""));
    const o = {};
    head.forEach((h, i) => (o[h] = cols[i]));
    return o;
  });
}
const pick = (row, names) => {
  for (const n of names) if (row[n] != null && row[n] !== "") return row[n];
  return "";
};
async function upsertBatches(tabla, filas, onConflict) {
  for (let i = 0; i < filas.length; i += 500) {
    const lote = filas.slice(i, i + 500);
    const { error } = await sb.from(tabla).upsert(lote, { onConflict });
    if (error) throw new Error(`${tabla}: ${error.message}`);
    process.stdout.write(`  ${tabla}: ${Math.min(i + 500, filas.length)}/${filas.length}\r`);
  }
  console.log("");
}

(async () => {
  console.log("→ Municipios:", MUNI_SRC);
  const muni = parseCSV(await leer(MUNI_SRC)).map((r) => ({
    ine_code: pick(r, ["ine_code", "cod_ine", "codigo_ine", "codigo", "cmun", "id_ine"]).padStart(5, "0"),
    nombre: pick(r, ["nombre", "municipio", "name", "nombre_municipio"]),
    provincia: pick(r, ["provincia", "nombre_provincia", "prov"]),
    ccaa: pick(r, ["ccaa", "comunidad", "autonomia", "nombre_ccaa"]) || null,
  })).filter((m) => m.ine_code && m.nombre);
  console.log(`  ${muni.length} municipios`);
  await upsertBatches("ref_municipios", muni, "ine_code");
  const codes = new Set(muni.map((m) => m.ine_code)); // para descartar filas huérfanas

  if (CP_SRC) {
    console.log("→ Códigos postales:", CP_SRC);
    const cp = parseCSV(await leer(CP_SRC)).map((r) => ({
      cp: pick(r, ["cp", "codigo_postal", "codpostal", "postal_code"]),
      ine_code: pick(r, ["ine_code", "cod_ine", "codigo_ine", "municipio_id", "cmun", "codigo"]).padStart(5, "0"),
    })).filter((x) => x.cp && codes.has(x.ine_code));
    console.log(`  ${cp.length} relaciones CP↔municipio`);
    await upsertBatches("ref_codigos_postales", cp, "cp,ine_code");
  } else {
    console.log("(Sin --cp: se omiten los códigos postales.)");
  }

  if (POB_SRC) {
    console.log("→ Población (INE):", POB_SRC);
    const pob = parseCSV(await leer(POB_SRC)).map((r) => ({
      ine_code: pick(r, ["ine_code", "cod_ine", "codigo_ine", "cmun", "codigo"]).padStart(5, "0"),
      poblacion: parseInt(pick(r, ["poblacion", "habitantes", "total", "pob"]).replace(/\D/g, ""), 10) || null,
    })).filter((x) => codes.has(x.ine_code) && x.poblacion != null);
    console.log(`  ${pob.length} municipios con población`);
    await upsertBatches("ref_municipios", pob, "ine_code"); // upsert: solo actualiza poblacion
  } else {
    console.log("(Sin --pob: se omite la población.)");
  }

  if (CENTROS_SRC) {
    console.log("→ Centros educativos:", CENTROS_SRC);
    const centros = parseCSV(await leer(CENTROS_SRC)).map((r) => ({
      codigo: pick(r, ["codigo", "cod_centro", "codigo_centro", "id"]),
      nombre: pick(r, ["nombre", "denominacion", "centro", "name"]),
      ine_code: pick(r, ["ine_code", "cod_ine", "codigo_ine", "municipio", "cmun"]).padStart(5, "0"),
      etapas: pick(r, ["etapas", "ensenanzas", "niveles"]) || null,
    })).filter((x) => x.codigo && x.nombre && codes.has(x.ine_code));
    console.log(`  ${centros.length} centros`);
    await upsertBatches("ref_centros", centros, "codigo");
  } else {
    console.log("(Sin --centros: se omiten los centros educativos.)");
  }

  console.log("✔ Importación completada.");
})().catch((e) => {
  console.error("✖", e.message);
  process.exit(1);
});
