-- Renombra informacion_epidemiologica.descripcion a descripcionentorno para
-- que quede más claro que es la descripción del entorno (vectores, clima,
-- condiciones del potrero), no una descripción general.

ALTER TABLE "informacion_epidemiologica" RENAME COLUMN "descripcion" TO "descripcionentorno";
