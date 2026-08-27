-- ============================================================================
-- Renombrar las tablas físicas para que coincidan exactamente con los nombres
-- de entidad definidos en el Apéndice B.2 (Modelo Lógico) del tomo.
-- Solo cambia el nombre físico de la tabla (ALTER TABLE ... RENAME TO); las
-- foreign keys de otras tablas se actualizan automáticamente en Postgres
-- porque referencian por OID, no por nombre. No se tocan columnas ni datos.
-- ============================================================================

ALTER TABLE "fincas" RENAME TO "finca";
ALTER TABLE "lotes" RENAME TO "lote";
ALTER TABLE "potreros" RENAME TO "potrero";
ALTER TABLE "razas" RENAME TO "raza";
ALTER TABLE "medicamentos" RENAME TO "medicamento";
ALTER TABLE "animales" RENAME TO "animal";
ALTER TABLE "historiales_medicos" RENAME TO "registro_medico";
ALTER TABLE "enfermedades_diagnosticadas" RENAME TO "detalle_diagnostico";
ALTER TABLE "tratamientos" RENAME TO "tratamiento";
ALTER TABLE "programas_desparasitacion" RENAME TO "programa_desparasitacion";
ALTER TABLE "calendarios_vacunacion" RENAME TO "calendario_vacunacion";
ALTER TABLE "registros_vacunacion" RENAME TO "registro_vacunacion";
ALTER TABLE "eventos_reproductivos" RENAME TO "evento_reproductivo";
ALTER TABLE "inseminaciones_artificiales" RENAME TO "inseminacion_artificial";
ALTER TABLE "diagnosticos_gestacion" RENAME TO "diagnostico_gestacion";
ALTER TABLE "gestaciones" RENAME TO "gestacion";
ALTER TABLE "nacimientos" RENAME TO "nacimiento";
ALTER TABLE "sementales" RENAME TO "semental";
ALTER TABLE "dispositivos_gps" RENAME TO "dispositivo_gps";
ALTER TABLE "registros_ubicacion" RENAME TO "registro_ubicacion";
ALTER TABLE "roles" RENAME TO "rol";
ALTER TABLE "privilegios" RENAME TO "privilegio";
ALTER TABLE "usuarios" RENAME TO "usuario";
ALTER TABLE "reglas_alerta" RENAME TO "regla_alerta";
ALTER TABLE "regla_alerta_usuario" RENAME TO "regla_usuario";
ALTER TABLE "notificaciones" RENAME TO "notificacion";
ALTER TABLE "registros_auditoria" RENAME TO "registro_auditoria";
