-- DETALLE_DIAGNOSTICO: "diagnostico" pasa a llamarse "diagnosticoDefinitivo",
-- igual que el campo equivalente a nivel de consulta en REGISTRO_MEDICO.
ALTER TABLE "detalle_diagnostico" RENAME COLUMN "diagnostico" TO "diagnosticoDefinitivo";
