-- ============================================================
-- Feedback de la veterinaria: identificación generalizada (arete,
-- hierro/número o microchip), registro propio de vitaminas (antes solo
-- texto libre), pruebas complementarias estructuradas (hematología,
-- coprología, etc.) y plan sanitario anual editable por finca.
-- ============================================================

-- CreateEnum
CREATE TYPE "TipoIdentificacion" AS ENUM ('ARETE', 'HIERRO_NUMERO', 'MICROCHIP', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoPruebaComplementaria" AS ENUM ('HEMATOLOGIA', 'COPROLOGIA', 'BIOQUIMICA', 'UROANALISIS', 'CITOLOGIA', 'HISTOPATOLOGIA', 'OTRO');

-- CreateEnum
CREATE TYPE "CategoriaActividadSanitaria" AS ENUM ('HIGIENE', 'DESINFECCION', 'VACUNA', 'VITAMINA', 'CONTROL_ECTOPARASITO', 'CONTROL_ENDOPARASITO', 'CONTROL_MOSCA', 'CONTROL_PLAGAS', 'OTRO');

-- AlterTable: la columna física "numeroArete" no cambia (Prisma Client ahora
-- la expone como "numeroIdentificacion" vía @map, sin tocar los datos
-- existentes); solo se agrega el tipo, con ARETE como valor por defecto
-- para todo lo ya registrado.
ALTER TABLE "animal" ADD COLUMN "tipoIdentificacion" "TipoIdentificacion" NOT NULL DEFAULT 'ARETE';

-- CreateTable
CREATE TABLE "prueba_complementaria" (
    "id" TEXT NOT NULL,
    "tipo" "TipoPruebaComplementaria" NOT NULL,
    "fecha" TIMESTAMP(3),
    "resultado" TEXT,
    "observaciones" TEXT,
    "registro_medico_id" TEXT NOT NULL,

    CONSTRAINT "prueba_complementaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_vitaminas" (
    "id" TEXT NOT NULL,
    "fechaAplicacion" TIMESTAMP(3) NOT NULL,
    "dosis" TEXT,
    "via" TEXT,
    "observaciones" TEXT,
    "animal_id" TEXT NOT NULL,
    "medicamento_id" TEXT NOT NULL,
    "veterinario_id" TEXT,

    CONSTRAINT "registro_vitaminas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_sanitario" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finca_id" TEXT NOT NULL,

    CONSTRAINT "plan_sanitario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividad_plan_sanitario" (
    "id" TEXT NOT NULL,
    "categoria" "CategoriaActividadSanitaria" NOT NULL,
    "nombreControl" TEXT NOT NULL,
    "unidadReferencia" TEXT,
    "prevencion" TEXT,
    "tratamiento" TEXT,
    "via" TEXT,
    "mesesProgramados" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "mesesCompletados" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "plan_sanitario_id" TEXT NOT NULL,

    CONSTRAINT "actividad_plan_sanitario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prueba_complementaria_registro_medico_id_idx" ON "prueba_complementaria"("registro_medico_id");

-- CreateIndex
CREATE INDEX "registro_vitaminas_animal_id_idx" ON "registro_vitaminas"("animal_id");

-- CreateIndex
CREATE INDEX "registro_vitaminas_medicamento_id_idx" ON "registro_vitaminas"("medicamento_id");

-- CreateIndex
CREATE UNIQUE INDEX "plan_sanitario_finca_id_anio_key" ON "plan_sanitario"("finca_id", "anio");

-- CreateIndex
CREATE INDEX "actividad_plan_sanitario_plan_sanitario_id_idx" ON "actividad_plan_sanitario"("plan_sanitario_id");

-- AddForeignKey
ALTER TABLE "prueba_complementaria" ADD CONSTRAINT "prueba_complementaria_registro_medico_id_fkey" FOREIGN KEY ("registro_medico_id") REFERENCES "registro_medico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_vitaminas" ADD CONSTRAINT "registro_vitaminas_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_vitaminas" ADD CONSTRAINT "registro_vitaminas_medicamento_id_fkey" FOREIGN KEY ("medicamento_id") REFERENCES "medicamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_vitaminas" ADD CONSTRAINT "registro_vitaminas_veterinario_id_fkey" FOREIGN KEY ("veterinario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_sanitario" ADD CONSTRAINT "plan_sanitario_finca_id_fkey" FOREIGN KEY ("finca_id") REFERENCES "finca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividad_plan_sanitario" ADD CONSTRAINT "actividad_plan_sanitario_plan_sanitario_id_fkey" FOREIGN KEY ("plan_sanitario_id") REFERENCES "plan_sanitario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
