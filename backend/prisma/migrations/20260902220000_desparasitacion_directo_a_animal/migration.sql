-- PROGRAMA_DESPARASITACION pasa a identificar al animal directamente
-- (animal_id), igual que ya se hizo con REGISTRO_VACUNACION, en vez de
-- depender de que exista una consulta médica (registro_medico_id).

-- 1. Columna nueva, primero nullable para poder rellenarla.
ALTER TABLE "programa_desparasitacion" ADD COLUMN "animal_id" TEXT;

-- 2. Rellenar desde registro_medico: hasta ahora registro_medico_id era
-- obligatorio, así que todas las filas existentes pueden resolver su animal.
UPDATE "programa_desparasitacion" pd
SET "animal_id" = rm."animal_id"
FROM "registro_medico" rm
WHERE pd."registro_medico_id" = rm."id";

-- 3. A partir de aquí, animal_id es obligatorio.
ALTER TABLE "programa_desparasitacion" ALTER COLUMN "animal_id" SET NOT NULL;

-- 4. Fuera la dependencia de registro_medico (Postgres retira junto con la
-- columna su índice y su llave foránea).
ALTER TABLE "programa_desparasitacion" DROP COLUMN "registro_medico_id";

-- 5. Índice y llave foránea hacia animal, igual que en registro_vacunacion.
CREATE INDEX "programa_desparasitacion_animal_id_idx" ON "programa_desparasitacion"("animal_id");

ALTER TABLE "programa_desparasitacion"
  ADD CONSTRAINT "programa_desparasitacion_animal_id_fkey"
  FOREIGN KEY ("animal_id") REFERENCES "animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
