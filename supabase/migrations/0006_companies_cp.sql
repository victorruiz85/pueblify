-- ============================================================
--  Pueblify · CP de la empresa (heredado del municipio)
--  La empresa toma el código postal de su municipio (se elige en un
--  desplegable y el CP se autocompleta).
-- ============================================================

alter table companies add column if not exists cp text;
