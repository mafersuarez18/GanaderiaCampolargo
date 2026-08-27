-- ============================================================================
-- Alinear cada columna física con el nombre exacto del Apéndice B.2 (Modelo
-- Lógico) del tomo. Los renombres se hacen vía ALTER TABLE ... RENAME COLUMN,
-- que en Postgres no rompe foreign keys (se referencian por atnum, no por
-- nombre). El código de la aplicación no cambia: Prisma sigue exponiendo los
-- mismos nombres de campo en TypeScript gracias a @map().
-- ============================================================================

-- ── lote / potrero ────────────────────────────────────────────────────────
ALTER TABLE "lote" RENAME COLUMN "fincaId" TO "finca_id";
ALTER TABLE "potrero" RENAME COLUMN "loteId" TO "lote_id";

-- ── usuario ──────────────────────────────────────────────────────────────
ALTER TABLE "usuario" RENAME COLUMN "rolId" TO "rol_id";

-- ── animal ───────────────────────────────────────────────────────────────
ALTER TABLE "animal" RENAME COLUMN "loteId" TO "lote_id";
ALTER TABLE "animal" RENAME COLUMN "razaId" TO "raza_id";
ALTER TABLE "animal" RENAME COLUMN "padreId" TO "padre_id";
ALTER TABLE "animal" RENAME COLUMN "madreId" TO "madre_id";
ALTER TABLE "animal" ADD COLUMN "nacimiento_id" TEXT;
ALTER TABLE "animal" ADD CONSTRAINT "animal_nacimiento_id_key" UNIQUE ("nacimiento_id");

-- ── semental / inventario_semen ─────────────────────────────────────────────
ALTER TABLE "semental" RENAME COLUMN "razaId" TO "raza_id";
ALTER TABLE "semental" RENAME COLUMN "observaciones" TO "descripcion";
ALTER TABLE "inventario_semen" RENAME COLUMN "sementalId" TO "semental_id";

-- ── evento_reproductivo / inseminacion_artificial ───────────────────────────
ALTER TABLE "evento_reproductivo" RENAME COLUMN "animalId" TO "animal_id";
ALTER TABLE "evento_reproductivo" RENAME COLUMN "registradoPorId" TO "usuario_id";
ALTER TABLE "inseminacion_artificial" RENAME COLUMN "eventoReproductivoId" TO "evento_reproductivo_id";
ALTER TABLE "inseminacion_artificial" RENAME COLUMN "inventarioSemenId" TO "inventario_semen_id";

-- ── gestacion / diagnostico_gestacion / nacimiento ──────────────────────────
ALTER TABLE "gestacion" RENAME COLUMN "eventoReproductivoId" TO "evento_reproductivo_id";
ALTER TABLE "diagnostico_gestacion" RENAME COLUMN "gestacionId" TO "gestacion_id";
ALTER TABLE "nacimiento" RENAME COLUMN "pesoAlNacer" TO "pesoCria";
ALTER TABLE "nacimiento" RENAME COLUMN "gestacionId" TO "gestacion_id";
ALTER TABLE "nacimiento" RENAME COLUMN "criaId" TO "animal_cria_id";

-- Vincular Animal con su Nacimiento de origen (dirección inversa a
-- nacimiento.animal_cria_id, ya existente); se completa donde hay dato real.
UPDATE "animal" a SET "nacimiento_id" = n.id
FROM "nacimiento" n
WHERE n."animal_cria_id" = a.id;

ALTER TABLE "animal" ADD CONSTRAINT "animal_nacimiento_id_fkey" FOREIGN KEY ("nacimiento_id") REFERENCES "nacimiento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── registro_medico: renombres + nueva columna estadosanitario ─────────────
ALTER TABLE "registro_medico" RENAME COLUMN "animalId" TO "animal_id";
ALTER TABLE "registro_medico" RENAME COLUMN "veterinarioId" TO "usuario_id";
ALTER TABLE "registro_medico" RENAME COLUMN "condicionCorporal" TO "condicioncorporal";
ALTER TABLE "registro_medico" RENAME COLUMN "litrosLechesDiarios" TO "litros_lechediario";
ALTER TABLE "registro_medico" RENAME COLUMN "gananciaPeso" TO "gananciapeso";
ALTER TABLE "registro_medico" RENAME COLUMN "tiempoLlenadoCapilar" TO "tiempollenadocapilar";
ALTER TABLE "registro_medico" ADD COLUMN "estadosanitario" "EstadoSanitario";

-- ── detalle_diagnostico: renombres + columnas trasladadas desde registro_medico ─
ALTER TABLE "detalle_diagnostico" RENAME COLUMN "historialMedicoId" TO "registro_medico_id";
ALTER TABLE "detalle_diagnostico" RENAME COLUMN "nombreEnfermedad" TO "nombre_condicion";
ALTER TABLE "detalle_diagnostico" RENAME COLUMN "nivelGravedad" TO "nivel_gravedad";
ALTER TABLE "detalle_diagnostico" ADD COLUMN "diagnostico" TEXT;
ALTER TABLE "detalle_diagnostico" ADD COLUMN "pronostico" TEXT;
ALTER TABLE "detalle_diagnostico" ADD COLUMN "planDiagnostico" TEXT;
ALTER TABLE "detalle_diagnostico" ADD COLUMN "tiempoEvolucion" TEXT;
ALTER TABLE "detalle_diagnostico" ADD COLUMN "sintomas" TEXT;

-- Las columnas diagnostico/pronostico/planDiagnostico/tiempoEvolucion pasan a
-- vivir en detalle_diagnostico (una por cada condición diagnosticada) en vez
-- de en registro_medico (una por consulta). No se migra el contenido de texto
-- existente porque la base es de datos de prueba (confirmado por el usuario).
ALTER TABLE "registro_medico" DROP COLUMN "diagnostico";
ALTER TABLE "registro_medico" DROP COLUMN "pronostico";
ALTER TABLE "registro_medico" DROP COLUMN "planDiagnostico";
ALTER TABLE "registro_medico" DROP COLUMN "tiempoEvolucion";

-- ── tratamiento ──────────────────────────────────────────────────────────
ALTER TABLE "tratamiento" RENAME COLUMN "medicamentoId" TO "medicamento_id";
ALTER TABLE "tratamiento" RENAME COLUMN "enfermedadDiagnosticadaId" TO "detalle_diagnostico_id";
ALTER TABLE "tratamiento" ADD COLUMN "descripcion" TEXT;

-- ── informacion_epidemiologica ──────────────────────────────────────────────
ALTER TABLE "informacion_epidemiologica" RENAME COLUMN "historialMedicoId" TO "registro_medico_id";
ALTER TABLE "informacion_epidemiologica" ADD COLUMN "veterinarioRegistro_id" TEXT;
UPDATE "informacion_epidemiologica" ie SET "veterinarioRegistro_id" = rm."usuario_id"
FROM "registro_medico" rm
WHERE ie."registro_medico_id" = rm.id;
ALTER TABLE "informacion_epidemiologica" ADD CONSTRAINT "informacion_epidemiologica_veterinarioRegistro_id_fkey" FOREIGN KEY ("veterinarioRegistro_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── programa_desparasitacion ────────────────────────────────────────────────
ALTER TABLE "programa_desparasitacion" RENAME COLUMN "historialMedicoId" TO "registro_medico_id";
ALTER TABLE "programa_desparasitacion" RENAME COLUMN "medicamentoId" TO "medicamento_id";
ALTER TABLE "programa_desparasitacion" RENAME COLUMN "fecha" TO "fechaAplicacion";
ALTER TABLE "programa_desparasitacion" ADD COLUMN "veterinario_id" TEXT;
UPDATE "programa_desparasitacion" pd SET "veterinario_id" = rm."usuario_id"
FROM "registro_medico" rm
WHERE pd."registro_medico_id" = rm.id;
ALTER TABLE "programa_desparasitacion" ADD CONSTRAINT "programa_desparasitacion_veterinario_id_fkey" FOREIGN KEY ("veterinario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── calendario_vacunacion / registro_vacunacion ─────────────────────────────
ALTER TABLE "calendario_vacunacion" RENAME COLUMN "medicamentoId" TO "medicamento_id";
ALTER TABLE "registro_vacunacion" RENAME COLUMN "historialMedicoId" TO "registro_medico_id";
ALTER TABLE "registro_vacunacion" RENAME COLUMN "calendarioVacunacionId" TO "calendario_vacunacion_id";
ALTER TABLE "registro_vacunacion" RENAME COLUMN "aplicadoPorId" TO "veterinario_id";

-- ── dispositivo_gps / registro_ubicacion ────────────────────────────────────
ALTER TABLE "dispositivo_gps" RENAME COLUMN "animalId" TO "animal_id";
ALTER TABLE "registro_ubicacion" RENAME COLUMN "dispositivoGPSId" TO "dispositivo_gps_id";
ALTER TABLE "registro_ubicacion" ADD COLUMN "finca_id" TEXT;

-- Backfill de finca_id derivándola de animal -> lote -> finca (columnas ya
-- renombradas a esta altura de la migración).
UPDATE "registro_ubicacion" ru SET "finca_id" = l."finca_id"
FROM "animal" a
JOIN "lote" l ON l."id" = a."lote_id"
WHERE ru."animalId" = a."id";

ALTER TABLE "registro_ubicacion" ADD CONSTRAINT "registro_ubicacion_finca_id_fkey" FOREIGN KEY ("finca_id") REFERENCES "finca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── registro_auditoria ──────────────────────────────────────────────────────
ALTER TABLE "registro_auditoria" RENAME COLUMN "usuarioId" TO "usuario_id";
ALTER TABLE "registro_auditoria" RENAME COLUMN "creadoEn" TO "fechaCreacion";

-- ── regla_alerta ─────────────────────────────────────────────────────────
ALTER TABLE "regla_alerta" RENAME COLUMN "creadoPorId" TO "usuarioCreador_id";
ALTER TABLE "regla_alerta" RENAME COLUMN "activa" TO "estado";

-- ── rol_privilegio ───────────────────────────────────────────────────────
ALTER TABLE "rol_privilegio" RENAME COLUMN "rolId" TO "rol_id";
ALTER TABLE "rol_privilegio" RENAME COLUMN "privilegioId" TO "privilegio_id";

-- ── regla_usuario: renombres + cambio de PK compuesta a id propio ─────────
-- (el tomo modela REGLA_USUARIO con su propio "id", no con PK compuesta)
ALTER TABLE "regla_usuario" RENAME COLUMN "reglaAlertaId" TO "regla_alerta_id";
ALTER TABLE "regla_usuario" RENAME COLUMN "usuarioId" TO "usuario_id";

ALTER TABLE "regla_usuario" DROP CONSTRAINT "regla_alerta_usuario_pkey";
ALTER TABLE "regla_usuario" ADD COLUMN "id" TEXT;
UPDATE "regla_usuario" SET "id" = gen_random_uuid()::text WHERE "id" IS NULL;
ALTER TABLE "regla_usuario" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "regla_usuario" ADD CONSTRAINT "regla_usuario_pkey" PRIMARY KEY ("id");
ALTER TABLE "regla_usuario" ADD CONSTRAINT "regla_usuario_regla_alerta_id_usuario_id_key" UNIQUE ("regla_alerta_id", "usuario_id");
ALTER TABLE "notificacion" ADD COLUMN "regla_usuario_id" TEXT;
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_regla_usuario_id_fkey" FOREIGN KEY ("regla_usuario_id") REFERENCES "regla_usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
