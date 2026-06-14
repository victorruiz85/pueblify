import { z } from "zod";

export const estadoSenal = z.enum(["necesario", "en_proceso", "resuelto", "no_aplica"]);

export const nuevoHogarSchema = z.object({
  contacto: z.string().min(3, "Indica el nombre del hogar o persona de contacto"),
  email: z.string().email("Email no válido").optional().or(z.literal("")),
  telefono: z.string().optional(),
  numAdultos: z.coerce.number().int().min(1, "Al menos un adulto").max(8),
  numMenores: z.coerce.number().int().min(0).max(8),
  origen: z.enum(["retorno", "exodo_urbano", "internacional", "movilidad_local"]),
  // Minimización RGPD: no se recoge el país/región de procedencia concreto
  // (podría revelar origen étnico). Basta la categoría de `origen`.
  vinculosPrevios: z.coerce.boolean().default(false),
  // El municipio destino es OPCIONAL: un caso puede entrar sin municipio asignado
  // (p. ej. interés inicial sin destino decidido) y asignarse más tarde.
  // Se elige del catálogo oficial (código INE); se resuelve a municipio operativo.
  municipioDestinoIne: z.string().optional(),
  empresaId: z.string().optional(),
  canal: z.enum(["web", "ayuntamiento", "empresa", "gal", "evento"]),
  // Señales de arraigo
  empleo_pareja: estadoSenal,
  escolarizacion: estadoSenal,
  transporte: estadoSenal,
  teletrabajo: estadoSenal,
  dependencia: estadoSenal,
  conciliacion: estadoSenal,
  integracion_social: estadoSenal,
  // RGPD: consentimiento informado obligatorio (incluye menores).
  // z.any: válido tanto desde RHF (boolean) como desde FormData (string).
  consentimiento: z
    .any()
    .refine((v) => v === true || v === "true" || v === "on", "Debes confirmar el consentimiento informado del hogar."),
});

export type NuevoHogarValues = z.infer<typeof nuevoHogarSchema>;

export const empresaSchema = z.object({
  nombre: z.string().min(2, "Indica el nombre de la empresa"),
  municipioId: z.string().optional(),
  sector: z.string().optional(),
  vacantes: z.coerce.number().int().min(0).default(0),
});

export const empadronamientoSchema = z.object({
  casoId: z.string(),
  personas: z.coerce.number().int().min(1, "Indica el número de personas"),
  menores: z.coerce.number().int().min(0),
  fecha: z.string().min(1, "Indica la fecha de empadronamiento"),
  fuente: z.string().optional(),
});
