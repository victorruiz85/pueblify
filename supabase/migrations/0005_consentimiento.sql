-- ============================================================
--  Pueblify · RGPD — registro del consentimiento informado
--  Guarda cuándo y con qué versión del aviso se obtuvo el consentimiento
--  del hogar (principio de responsabilidad proactiva, art. 5.2 RGPD).
-- ============================================================

alter table households add column if not exists consent_at      timestamptz;
alter table households add column if not exists consent_version text;
