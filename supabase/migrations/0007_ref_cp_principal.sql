-- ============================================================
--  Pueblify · CP principal por municipio en el catálogo oficial
--  Simplifica la cascada provincia → municipio → CP (un CP de cabecera).
-- ============================================================

alter table ref_municipios add column if not exists cp_principal text;
