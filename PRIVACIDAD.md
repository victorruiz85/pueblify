# Pueblify · Protección de datos (RGPD / LOPDGDPR)

> **Aviso:** este documento es un borrador técnico de apoyo, **no es asesoramiento jurídico**.
> Los instrumentos formales (RAT, contrato de encargo, EIPD, textos legales) deben ser
> revisados y aprobados por un **DPO o abogado especializado** antes de tratar datos reales.
> La demo (`pueblify-demo.html`) usa datos ficticios y no está sujeta a esto.

## 1. ¿Se tratan datos personales y sensibles? Sí

Pueblify trata datos personales de los hogares y, potencialmente, **categorías especiales**
(art. 9 RGPD). Por eso el nivel de exigencia es alto.

| Dato | ¿Categoría especial? |
|---|---|
| Contacto, email, teléfono del hogar | Personal común |
| Composición del hogar, edades de miembros | Personal común |
| **Menores** (edad, etapa escolar — sin nombre) | Protección reforzada (art. 8) |
| Origen (categoría: retorno/urbano/internacional/local) | Común (sin país concreto) |
| Señal "necesidad de apoyo" (antes "dependencia") | Posible dato de salud → se ha reformulado para evitar detalle clínico |
| Empleo, presupuesto, vivienda | Común, sensible en la práctica |
| Empadronamiento (nº personas/menores) | Común |
| Índice de Arraigo (puntuación de la persona) | Elaboración de perfiles (art. 22) |

## 2. Roles (PENDIENTE de decisión con el DPO)

A decidir: ¿el **responsable** es el ente público (GAL/ayuntamiento/agencia) y Pueblify el
**encargado del tratamiento**, o Pueblify es responsable? Lo más habitual en B2G es el primero.
De esta decisión dependen: quién mantiene el RAT, quién firma el contrato de encargo y quién
atiende los derechos. **Documentos a generar según el caso:** contrato de encargo (art. 28) y,
si Pueblify usa datos para fines propios (p. ej. benchmark/informes), base y anonimización
separadas (sería responsable para ese fin).

## 3. Base jurídica (PENDIENTE de decisión con el DPO)

Opciones: **consentimiento explícito** del hogar (lo más limpio para un programa voluntario con
datos sensibles; consentimiento parental para menores) o **misión de interés público** del ente
(si tiene competencia normativa). La app ya **captura y registra el consentimiento** (fecha +
versión) en el alta, válido para cualquiera de los dos escenarios.

## 4. Medidas ya aplicadas (privacidad desde el diseño, art. 25)

- **Minimización:** no se registra el país/región de procedencia concreto (solo la categoría);
  la señal de salud se reformuló de "dependencia/cuidados" a **"necesidad de apoyo"** (sin
  detalle clínico); los **menores se guardan sin nombre** (solo edad y etapa).
- **Consentimiento informado** obligatorio en el alta, con marca temporal y versión (`households.consent_at`/`consent_version`).
- **Control de acceso (RLS):** cada técnico ve solo sus casos; el **ayuntamiento ve agregados, no personas**.
- **Sin decisiones automatizadas:** el Índice de Arraigo es apoyo para el técnico; decide una persona.
- **Cifrado** en tránsito y en reposo (provisto por Supabase) y separación de claves service/anon.

## 5. EIPD / DPIA — probablemente OBLIGATORIA

Confluyen factores que suelen exigir Evaluación de Impacto (art. 35 RGPD; lista AEPD):
categorías especiales, **menores y colectivos vulnerables**, y **elaboración de perfiles**
(Índice de Arraigo). Acción: realizar la EIPD **antes** del tratamiento real, documentando que
el scoring no produce efectos jurídicos automatizados.

## 6. Encargados, sub-encargados y transferencias

- **Sub-encargados:** Supabase (BBDD/almacenamiento) y Vercel (hosting). Requieren su contrato
  de encargo (DPA) y figurar en el RAT.
- **Transferencias:** alojar en **región UE**. Configurado `vercel.json` → `fra1` (Fráncfort);
  crear el proyecto **Supabase en región UE** (Fráncfort/Irlanda). Evita transferencias a EE. UU.
- **ENS (Esquema Nacional de Seguridad):** si el responsable es administración pública, el
  proveedor/solución debe cumplir el ENS. **Pendiente** de abordar cuando haya cliente público.

## 7. Conservación (PROPUESTA, a confirmar)

Mantener los datos del caso mientras dure el acompañamiento y hasta **X años** tras el cierre/baja
(a fijar por el responsable según finalidad y obligaciones); después, supresión o anonimización.

## 8. Derechos de los interesados

Acceso, rectificación, supresión, oposición, limitación y portabilidad. Soporte técnico actual:
las claves foráneas con `on delete cascade` permiten la **supresión** completa de un hogar y sus
casos; la lectura por API permite **exportar** sus datos. Pendiente: pantalla/acción de "exportar
y borrar hogar" para el rol responsable (siguiente iteración).

## 9. Registro de Actividades de Tratamiento (RAT) — esqueleto

| Campo | Contenido (a completar por el responsable) |
|---|---|
| Actividad | Acompañamiento a hogares en programa de atracción de población |
| Responsable | (pendiente: ente público / Pueblify) |
| Encargado | Pueblify (y sub-encargados: Supabase, Vercel) |
| Fines | Gestión de casos, medición de impacto (habitantes fijados) |
| Categorías de interesados | Hogares (adultos y menores), contactos |
| Categorías de datos | Identificativos, socioeconómicos, escolarización; señal de apoyo |
| Base jurídica | (pendiente: consentimiento / interés público) |
| Cesiones | Ninguna por defecto; agregados al ayuntamiento |
| Transferencias | No (alojamiento UE) |
| Conservación | (pendiente) |
| Medidas de seguridad | RLS, cifrado, minimización, registro de accesos |

## 10. Textos (BORRADOR, revisar con el DPO)

**Aviso de privacidad (resumen para el alta):** ver el desplegable en la pantalla "Nuevo caso".

**Cláusula de consentimiento:** «He informado al hogar y cuenta con su consentimiento para el
tratamiento de sus datos personales, incluidos los de los menores, con la finalidad de gestionar
su acompañamiento en el programa de atracción de población.»

## 11. Pendientes para el DPO/abogado

1. Definir responsable vs encargado y firmar contrato de encargo (con Pueblify y sub-encargados).
2. Elegir y documentar la base jurídica (y, para menores, el consentimiento parental).
3. Realizar la EIPD.
4. Redactar el aviso de privacidad y la cláusula de consentimiento definitivos.
5. Fijar plazos de conservación.
6. Confirmar región UE y, si aplica, plan de cumplimiento ENS.
7. Procedimiento de brechas de seguridad (notificación a la AEPD en 72 h).
