-- Ajustes al modelo lógico del tomo (Apéndice B.2, revisión actual del documento):
--
-- 1. RAZA ya no incluye proposito ni descripcion — el propósito queda
--    exclusivamente en ANIMAL, y el catálogo de razas se reduce a
--    nombre/tipoCruce/origen.
-- 2. ANIMAL: los nombres físicos de columna "marcas" y "observaciones" no
--    coincidían con los del tomo ("marcadistintiva" y "descripcion"). Se
--    renombran para no perder los datos ya cargados.
-- 3. REGLA_ALERTA: "evaluarCadaHoras" no coincidía con el nombre del tomo
--    ("evaluarCadaHora", singular). Se renombra por el mismo motivo.

ALTER TABLE "raza" DROP COLUMN "proposito";
ALTER TABLE "raza" DROP COLUMN "descripcion";

ALTER TABLE "animal" RENAME COLUMN "marcas" TO "marcadistintiva";
ALTER TABLE "animal" RENAME COLUMN "observaciones" TO "descripcion";

ALTER TABLE "regla_alerta" RENAME COLUMN "evaluarCadaHoras" TO "evaluarCadaHora";
