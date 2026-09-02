-- REGISTRO_VACUNACION ya identifica al animal directamente por animal_id
-- (agregado en la migración anterior); registro_medico_id queda redundante
-- y se elimina. Postgres retira junto con la columna su índice y su llave
-- foránea.
ALTER TABLE "registro_vacunacion" DROP COLUMN "registro_medico_id";
