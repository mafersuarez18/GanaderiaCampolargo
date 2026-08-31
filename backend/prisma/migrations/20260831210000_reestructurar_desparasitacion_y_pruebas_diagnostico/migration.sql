-- 1. PROGRAMA_DESPARASITACION: el producto usado ya no es texto libre —
--    siempre referencia un Medicamento del catálogo (se crea al vuelo desde
--    el formulario si el veterinario escribe uno que aún no existe, igual
--    que se hace con Raza en el formulario de Animal). No hay filas
--    existentes en esta tabla, así que no hace falta backfill.
ALTER TABLE "programa_desparasitacion" DROP COLUMN "producto";
ALTER TABLE "programa_desparasitacion" DROP COLUMN "principioActivo";
ALTER TABLE "programa_desparasitacion" ALTER COLUMN "medicamento_id" SET NOT NULL;

-- 2. REGISTRO_MEDICO: los resultados de pruebas de rutina/obligatorias
--    (Tuberculosis/Brucelosis, etc.), no ligadas a una enfermedad
--    diagnosticada específica, se renombran para reflejar mejor su alcance.
ALTER TABLE "registro_medico" RENAME COLUMN "observacionesDiagnosticosOficiales" TO "resultadosPruebas";

-- 3. DETALLE_DIAGNOSTICO: nueva columna opcional para los resultados de
--    pruebas específicas de cada enfermedad diagnosticada.
ALTER TABLE "detalle_diagnostico" ADD COLUMN "pruebasDiagnostico" VARCHAR;
