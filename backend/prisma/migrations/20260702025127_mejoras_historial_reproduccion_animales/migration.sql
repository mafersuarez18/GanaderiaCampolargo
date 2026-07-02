-- CreateEnum
CREATE TYPE "EstadoReproductivo" AS ENUM ('ENTERO', 'CASTRADO', 'LACTANTE', 'GESTANTE');

-- CreateEnum
CREATE TYPE "TipoAyudaDiagnostica" AS ENUM ('HEMOGRAMA', 'BIOQUIMICA_SANGUINEA', 'RASPADO_PIEL', 'ANALISIS_COPROLOGICO', 'TEST_CALIFORNIA_MASTITIS', 'ECOGRAFIA', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoDesparasitante" AS ENUM ('ECTOPARASITO', 'ENDOPARASITO', 'AMBOS');

-- CreateEnum
CREATE TYPE "ClasificacionIA" AS ENUM ('CELO_DETECTADO', 'TIEMPO_FIJO');

-- CreateEnum
CREATE TYPE "TecnicaDeposicionSemen" AS ENUM ('INTRAUTERINA_RECTOVAGINAL', 'INTRAUTERINA_PROFUNDA');

-- CreateEnum
CREATE TYPE "NivelEstres" AS ENUM ('ALTO', 'MEDIO', 'BAJO');

-- AlterTable
ALTER TABLE "animales" ADD COLUMN     "procedencia" TEXT,
ADD COLUMN     "tipoCruce" TEXT;

-- AlterTable
ALTER TABLE "historiales_medicos" ADD COLUMN     "cirugias" TEXT,
ADD COLUMN     "condicionCorporal" DOUBLE PRECISION,
ADD COLUMN     "diagnosticoDefinitivo" TEXT,
ADD COLUMN     "estadoReproductivo" "EstadoReproductivo",
ADD COLUMN     "frecuenciaCardiaca" INTEGER,
ADD COLUMN     "frecuenciaRespiratoria" INTEGER,
ADD COLUMN     "gananciaPeso" DOUBLE PRECISION,
ADD COLUMN     "litrosLechesDiarios" DOUBLE PRECISION,
ADD COLUMN     "movimientosRuminales" INTEGER,
ADD COLUMN     "observacionesDiagnosticosOficiales" TEXT,
ADD COLUMN     "planDiagnostico" TEXT,
ADD COLUMN     "temperatura" DOUBLE PRECISION,
ADD COLUMN     "tiempoEvolucion" TEXT,
ADD COLUMN     "tiempoLlenadoCapilar" DOUBLE PRECISION,
ADD COLUMN     "tratamientosPrevios" TEXT;

-- AlterTable
ALTER TABLE "inseminaciones_artificiales" ADD COLUMN     "balanceEnergetico" TEXT,
ADD COLUMN     "clasificacionIA" "ClasificacionIA",
ADD COLUMN     "manejoHato" "NivelEstres",
ADD COLUMN     "patologiasVaca" TEXT,
ADD COLUMN     "tasaMetabolicaBasal" INTEGER,
ADD COLUMN     "tecnicaDeposicion" "TecnicaDeposicionSemen",
ADD COLUMN     "temperaturaUterina" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "inventario_semen" ADD COLUMN     "temperatura" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "informacion_epidemiologica" (
    "id" TEXT NOT NULL,
    "garrapatas" BOOLEAN NOT NULL DEFAULT false,
    "mosquitos" BOOLEAN NOT NULL DEFAULT false,
    "murcielagos" BOOLEAN NOT NULL DEFAULT false,
    "moscas" BOOLEAN NOT NULL DEFAULT false,
    "otrosVectores" TEXT,
    "descripcion" TEXT,
    "historialMedicoId" TEXT NOT NULL,

    CONSTRAINT "informacion_epidemiologica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ayudas_diagnosticas" (
    "id" TEXT NOT NULL,
    "tipo" "TipoAyudaDiagnostica" NOT NULL,
    "descripcion" TEXT,
    "resultado" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "historialMedicoId" TEXT NOT NULL,

    CONSTRAINT "ayudas_diagnosticas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programas_desparasitacion" (
    "id" TEXT NOT NULL,
    "producto" TEXT NOT NULL,
    "principioActivo" TEXT,
    "tipo" "TipoDesparasitante" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "dosis" TEXT,
    "via" TEXT,
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "historialMedicoId" TEXT NOT NULL,

    CONSTRAINT "programas_desparasitacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "informacion_epidemiologica_historialMedicoId_key" ON "informacion_epidemiologica"("historialMedicoId");

-- CreateIndex
CREATE INDEX "ayudas_diagnosticas_historialMedicoId_idx" ON "ayudas_diagnosticas"("historialMedicoId");

-- CreateIndex
CREATE INDEX "programas_desparasitacion_historialMedicoId_idx" ON "programas_desparasitacion"("historialMedicoId");

-- AddForeignKey
ALTER TABLE "informacion_epidemiologica" ADD CONSTRAINT "informacion_epidemiologica_historialMedicoId_fkey" FOREIGN KEY ("historialMedicoId") REFERENCES "historiales_medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ayudas_diagnosticas" ADD CONSTRAINT "ayudas_diagnosticas_historialMedicoId_fkey" FOREIGN KEY ("historialMedicoId") REFERENCES "historiales_medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programas_desparasitacion" ADD CONSTRAINT "programas_desparasitacion_historialMedicoId_fkey" FOREIGN KEY ("historialMedicoId") REFERENCES "historiales_medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
