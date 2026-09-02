-- Un RegistroVacunacion solo llegaba al animal a través de registro_medico_id
-- (opcional): una vacunación aplicada sin consulta previa quedaba sin forma
-- de saber a qué animal pertenecía, y por lo tanto invisible para el motor
-- de alertas. Se agrega la columna directa animal_id.

-- 1. Columna nueva, primero nullable para poder rellenarla.
ALTER TABLE "registro_vacunacion" ADD COLUMN "animal_id" TEXT;

-- 2. Rellenar desde registro_medico donde exista ese vínculo.
UPDATE "registro_vacunacion" rv
SET "animal_id" = rm."animal_id"
FROM "registro_medico" rm
WHERE rv."registro_medico_id" = rm."id"
  AND rv."animal_id" IS NULL;

-- 3. Los registros que ni por esa vía puedan resolver un animal son datos
-- huérfanos de la propia limitación que esta migración corrige — no queda
-- otra forma válida de recuperarlos.
DELETE FROM "registro_vacunacion" WHERE "animal_id" IS NULL;

-- 4. A partir de aquí, animal_id es obligatorio.
ALTER TABLE "registro_vacunacion" ALTER COLUMN "animal_id" SET NOT NULL;

-- 5. Índice y llave foránea, igual que el resto de las relaciones con Animal.
CREATE INDEX "registro_vacunacion_animal_id_idx" ON "registro_vacunacion"("animal_id");

ALTER TABLE "registro_vacunacion"
  ADD CONSTRAINT "registro_vacunacion_animal_id_fkey"
  FOREIGN KEY ("animal_id") REFERENCES "animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
