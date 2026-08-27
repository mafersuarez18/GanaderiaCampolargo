-- ============================================================================
-- Elimina columnas operativas que no aparecen en el modelo lógico del tomo:
--   - activo/activa (baja lógica) en 9 catálogos + regla_alerta (esta última
--     ya vive físicamente como "estado")
--   - creadoEn/actualizadoEn (timestamps de auditoría) en casi todas las
--     tablas, EXCEPTO:
--       * registro_auditoria.creadoEn (columna real "fechaCreacion") — es
--         un atributo explícito del tomo (REGISTRO_AUDITORIA.fechaCreacion)
--       * notificacion.creadoEn — sin ella el motor de alertas duplicaría
--         cada notificación en cada evaluación (no hay otro campo de fecha
--         en NOTIFICACION según el tomo)
--       * animal.actualizadoEn — se usa para acotar por fecha las métricas
--         de mortalidad/ventas del dashboard (no hay fechaMuerte/fechaVenta
--         separado en el tomo)
--   - animal.latitudActual/longitudActual — la última posición pasa a
--     derivarse siempre del registro más reciente en registro_ubicacion,
--     en vez de guardarse duplicada en animal.
-- Postgres elimina automáticamente cualquier índice que dependa únicamente
-- de una columna eliminada (ej. inventario_semen_activo_idx).
-- ============================================================================

-- ── activo/activa (baja lógica) ─────────────────────────────────────────────
ALTER TABLE "finca"                 DROP COLUMN "activa";
ALTER TABLE "lote"                  DROP COLUMN "activo";
ALTER TABLE "potrero"               DROP COLUMN "activo";
ALTER TABLE "raza"                  DROP COLUMN "activa";
ALTER TABLE "medicamento"           DROP COLUMN "activo";
ALTER TABLE "calendario_vacunacion" DROP COLUMN "activo";
ALTER TABLE "semental"              DROP COLUMN "activo";
ALTER TABLE "inventario_semen"      DROP COLUMN "activo";
ALTER TABLE "dispositivo_gps"       DROP COLUMN "activo";
ALTER TABLE "regla_alerta"          DROP COLUMN "estado";

-- ── animal: última posición GPS (se deriva de registro_ubicacion) ──────────
ALTER TABLE "animal" DROP COLUMN "latitudActual";
ALTER TABLE "animal" DROP COLUMN "longitudActual";

-- ── creadoEn/actualizadoEn ───────────────────────────────────────────────────
ALTER TABLE "finca"                    DROP COLUMN "creadoEn";
ALTER TABLE "finca"                    DROP COLUMN "actualizadoEn";
ALTER TABLE "lote"                     DROP COLUMN "creadoEn";
ALTER TABLE "lote"                     DROP COLUMN "actualizadoEn";
ALTER TABLE "potrero"                  DROP COLUMN "creadoEn";
ALTER TABLE "potrero"                  DROP COLUMN "actualizadoEn";
ALTER TABLE "raza"                     DROP COLUMN "creadoEn";
ALTER TABLE "medicamento"              DROP COLUMN "creadoEn";
ALTER TABLE "medicamento"              DROP COLUMN "actualizadoEn";
ALTER TABLE "animal"                   DROP COLUMN "creadoEn";
ALTER TABLE "registro_medico"          DROP COLUMN "creadoEn";
ALTER TABLE "registro_medico"          DROP COLUMN "actualizadoEn";
ALTER TABLE "detalle_diagnostico"      DROP COLUMN "creadoEn";
ALTER TABLE "detalle_diagnostico"      DROP COLUMN "actualizadoEn";
ALTER TABLE "tratamiento"              DROP COLUMN "creadoEn";
ALTER TABLE "tratamiento"              DROP COLUMN "actualizadoEn";
ALTER TABLE "programa_desparasitacion" DROP COLUMN "creadoEn";
ALTER TABLE "calendario_vacunacion"    DROP COLUMN "creadoEn";
ALTER TABLE "calendario_vacunacion"    DROP COLUMN "actualizadoEn";
ALTER TABLE "registro_vacunacion"      DROP COLUMN "creadoEn";
ALTER TABLE "evento_reproductivo"      DROP COLUMN "creadoEn";
ALTER TABLE "evento_reproductivo"      DROP COLUMN "actualizadoEn";
ALTER TABLE "inseminacion_artificial"  DROP COLUMN "creadoEn";
ALTER TABLE "diagnostico_gestacion"    DROP COLUMN "creadoEn";
ALTER TABLE "gestacion"                DROP COLUMN "creadoEn";
ALTER TABLE "gestacion"                DROP COLUMN "actualizadoEn";
ALTER TABLE "nacimiento"               DROP COLUMN "creadoEn";
ALTER TABLE "semental"                 DROP COLUMN "creadoEn";
ALTER TABLE "semental"                 DROP COLUMN "actualizadoEn";
ALTER TABLE "inventario_semen"         DROP COLUMN "creadoEn";
ALTER TABLE "inventario_semen"         DROP COLUMN "actualizadoEn";
ALTER TABLE "dispositivo_gps"          DROP COLUMN "creadoEn";
ALTER TABLE "dispositivo_gps"          DROP COLUMN "actualizadoEn";
ALTER TABLE "rol"                      DROP COLUMN "creadoEn";
ALTER TABLE "rol"                      DROP COLUMN "actualizadoEn";
ALTER TABLE "privilegio"               DROP COLUMN "creadoEn";
ALTER TABLE "usuario"                  DROP COLUMN "creadoEn";
ALTER TABLE "usuario"                  DROP COLUMN "actualizadoEn";
ALTER TABLE "regla_alerta"             DROP COLUMN "creadoEn";
ALTER TABLE "regla_alerta"             DROP COLUMN "actualizadoEn";
