-- ============================================================
-- Alineación con el modelo lógico revisado del tomo (Apéndice B.2):
--   1) ANIMAL: lote obligatorio, se retira la FK directa a finca
--      (la finca se alcanza vía lote → finca)
--   2) GESTACION: vínculo opcional al evento reproductivo que la originó
--   3) ENFERMEDADES_DIAGNOSTICADAS: nivel de gravedad
--   4) TRATAMIENTOS: vínculo opcional a la enfermedad diagnosticada específica
--   5) PROGRAMAS_DESPARASITACION: vínculo opcional al catálogo de medicamentos
--   6) REGLAS_ALERTA: destinatarios dinámicos por rol (reemplaza los 3
--      booleanos fijos notificarAdministrador/Veterinario/Tecnico)
-- ============================================================

-- ── 1) ANIMAL: lote obligatorio, sin finca_id directa ─────────────────────────

-- Backfill: los animales sin lote (hoy solo datos de prueba del motor de
-- alertas) se asignan al primer lote activo de su misma finca.
UPDATE "animales" a
SET "loteId" = (
  SELECT l.id FROM "lotes" l
  WHERE l."fincaId" = a."fincaId" AND l.activo = true
  ORDER BY l.nombre ASC
  LIMIT 1
)
WHERE a."loteId" IS NULL;

ALTER TABLE "animales" ALTER COLUMN "loteId" SET NOT NULL;

ALTER TABLE "animales" DROP CONSTRAINT "animales_loteId_fkey";
ALTER TABLE "animales" ADD CONSTRAINT "animales_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "lotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "animales" DROP CONSTRAINT "animales_fincaId_fkey";
DROP INDEX "animales_fincaId_idx";
ALTER TABLE "animales" DROP COLUMN "fincaId";

-- ── 2) GESTACION → EVENTO_REPRODUCTIVO (opcional) ─────────────────────────────

ALTER TABLE "gestaciones" ADD COLUMN "eventoReproductivoId" TEXT;
CREATE UNIQUE INDEX "gestaciones_eventoReproductivoId_key" ON "gestaciones"("eventoReproductivoId");
ALTER TABLE "gestaciones" ADD CONSTRAINT "gestaciones_eventoReproductivoId_fkey" FOREIGN KEY ("eventoReproductivoId") REFERENCES "eventos_reproductivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── 3) EnfermedadDiagnosticada.nivelGravedad ──────────────────────────────────

CREATE TYPE "NivelGravedad" AS ENUM ('LEVE', 'MODERADA', 'GRAVE');
ALTER TABLE "enfermedades_diagnosticadas" ADD COLUMN "nivelGravedad" "NivelGravedad";

-- ── 4) Tratamiento → EnfermedadDiagnosticada (opcional) ───────────────────────

ALTER TABLE "tratamientos" ADD COLUMN "enfermedadDiagnosticadaId" TEXT;
CREATE INDEX "tratamientos_enfermedadDiagnosticadaId_idx" ON "tratamientos"("enfermedadDiagnosticadaId");
ALTER TABLE "tratamientos" ADD CONSTRAINT "tratamientos_enfermedadDiagnosticadaId_fkey" FOREIGN KEY ("enfermedadDiagnosticadaId") REFERENCES "enfermedades_diagnosticadas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── 5) ProgramaDesparasitacion → Medicamento (opcional) ───────────────────────

ALTER TABLE "programas_desparasitacion" ADD COLUMN "medicamentoId" TEXT;
CREATE INDEX "programas_desparasitacion_medicamentoId_idx" ON "programas_desparasitacion"("medicamentoId");
ALTER TABLE "programas_desparasitacion" ADD CONSTRAINT "programas_desparasitacion_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "medicamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── 6) ReglaAlerta: destinatarios dinámicos por rol ───────────────────────────

CREATE TABLE "regla_alerta_rol" (
    "reglaAlertaId" TEXT NOT NULL,
    "rolId" TEXT NOT NULL,

    CONSTRAINT "regla_alerta_rol_pkey" PRIMARY KEY ("reglaAlertaId","rolId")
);

ALTER TABLE "regla_alerta_rol" ADD CONSTRAINT "regla_alerta_rol_reglaAlertaId_fkey" FOREIGN KEY ("reglaAlertaId") REFERENCES "reglas_alerta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "regla_alerta_rol" ADD CONSTRAINT "regla_alerta_rol_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill sin pérdida de datos: cada booleano en verdadero se convierte en
-- una fila de destinatario para el rol equivalente.
INSERT INTO "regla_alerta_rol" ("reglaAlertaId", "rolId")
SELECT "id", 'rol_administrador' FROM "reglas_alerta" WHERE "notificarAdministrador" = true;

INSERT INTO "regla_alerta_rol" ("reglaAlertaId", "rolId")
SELECT "id", 'rol_veterinario' FROM "reglas_alerta" WHERE "notificarVeterinario" = true;

INSERT INTO "regla_alerta_rol" ("reglaAlertaId", "rolId")
SELECT "id", 'rol_tecnico' FROM "reglas_alerta" WHERE "notificarTecnico" = true;

ALTER TABLE "reglas_alerta" DROP COLUMN "notificarAdministrador";
ALTER TABLE "reglas_alerta" DROP COLUMN "notificarVeterinario";
ALTER TABLE "reglas_alerta" DROP COLUMN "notificarTecnico";
