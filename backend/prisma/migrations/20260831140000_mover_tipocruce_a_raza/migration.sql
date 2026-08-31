-- Mueve tipoCruce de animal a raza: el tipo de cruce genético pasa a ser un
-- atributo del catálogo de razas en vez de un dato individual por animal.

ALTER TABLE "raza" ADD COLUMN "tipoCruce" VARCHAR;

ALTER TABLE "animal" DROP COLUMN "tipoCruce";
