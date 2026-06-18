-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MACHO', 'HEMBRA');

-- CreateEnum
CREATE TYPE "EstadoAnimal" AS ENUM ('ACTIVO', 'VENDIDO', 'MUERTO', 'ROBADO', 'TRANSFERIDO');

-- CreateEnum
CREATE TYPE "TipoPropositoAnimal" AS ENUM ('CARNE', 'LECHE', 'CARNE_LECHE', 'REPRODUCCION', 'TAUROMAQUIA');

-- CreateEnum
CREATE TYPE "EstadoSanitario" AS ENUM ('SANO', 'ENFERMO', 'EN_TRATAMIENTO', 'EN_OBSERVACION', 'CUARENTENA');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMINISTRADOR', 'VETERINARIO', 'TECNICO');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('ACTIVO', 'INACTIVO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "TipoEventoReproductivo" AS ENUM ('DETECCION_CELO', 'INSEMINACION_ARTIFICIAL', 'MONTA_NATURAL', 'DIAGNOSTICO_GESTACION', 'PARTO', 'ABORTO', 'DESTETE', 'DESCARTE_REPRODUCTIVO');

-- CreateEnum
CREATE TYPE "ResultadoDiagnosticoGestacion" AS ENUM ('POSITIVO', 'NEGATIVO', 'DUDOSO', 'PENDIENTE');

-- CreateEnum
CREATE TYPE "EstadoGestacion" AS ENUM ('EN_CURSO', 'FINALIZADA_PARTO', 'FINALIZADA_ABORTO', 'PERDIDA');

-- CreateEnum
CREATE TYPE "TipoParto" AS ENUM ('NORMAL', 'DISTOCICO', 'CESAREA', 'PREMATURO');

-- CreateEnum
CREATE TYPE "EstadoCria" AS ENUM ('VIVO', 'MUERTO_AL_NACER', 'MUERTO_NEONATAL');

-- CreateEnum
CREATE TYPE "TipoInseminacion" AS ENUM ('SEMEN_FRESCO', 'SEMEN_REFRIGERADO', 'SEMEN_CONGELADO', 'OVULO_FERTILIZADO');

-- CreateEnum
CREATE TYPE "EstadoTratamiento" AS ENUM ('EN_CURSO', 'COMPLETADO', 'SUSPENDIDO', 'FALLIDO');

-- CreateEnum
CREATE TYPE "TipoAlertaRegla" AS ENUM ('VACUNA_VENCIDA', 'VACUNA_PROXIMA', 'PARTO_PROXIMO', 'DIAS_ABIERTOS_EXCEDIDOS', 'INTERVALO_REPRODUCTIVO_PROLONGADO', 'AUSENCIA_CONTROL_VETERINARIO', 'ENFERMEDAD_ACTIVA_SIN_RESOLUCION', 'INVENTARIO_SEMEN_BAJO', 'CONTROL_PESO_PENDIENTE', 'PERSONALIZADA');

-- CreateEnum
CREATE TYPE "PrioridadAlerta" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "EstadoNotificacion" AS ENUM ('PENDIENTE', 'ENVIADA', 'LEIDA', 'DESCARTADA');

-- CreateEnum
CREATE TYPE "TipoAccionAuditoria" AS ENUM ('CREAR', 'LEER', 'ACTUALIZAR', 'ELIMINAR', 'INICIAR_SESION', 'CERRAR_SESION', 'INTENTO_ACCESO_FALLIDO', 'EXPORTAR', 'CONFIGURAR');

-- CreateEnum
CREATE TYPE "EstadoDispositivoGPS" AS ENUM ('ACTIVO', 'INACTIVO', 'SIN_SEÑAL', 'BATERIA_BAJA');

-- CreateTable
CREATE TABLE "fincas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Yaracuy',
    "direccion" TEXT,
    "hectareas" DOUBLE PRECISION,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "latitudCentro" DOUBLE PRECISION,
    "longitudCentro" DOUBLE PRECISION,

    CONSTRAINT "fincas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "capacidad" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "fincaId" TEXT NOT NULL,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "potreros" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "hectareas" DOUBLE PRECISION,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "loteId" TEXT NOT NULL,

    CONSTRAINT "potreros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "razas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "origen" TEXT,
    "proposito" "TipoPropositoAnimal" NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "razas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicamentos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "principioActivo" TEXT,
    "laboratorio" TEXT,
    "presentacion" TEXT,
    "concentracion" TEXT,
    "unidadMedida" TEXT,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animales" (
    "id" TEXT NOT NULL,
    "numeroArete" TEXT NOT NULL,
    "nombre" TEXT,
    "sexo" "Sexo" NOT NULL,
    "fechaNacimiento" TIMESTAMP(3),
    "pesoNacimiento" DOUBLE PRECISION,
    "pesoActual" DOUBLE PRECISION,
    "color" TEXT,
    "marcas" TEXT,
    "proposito" "TipoPropositoAnimal" NOT NULL,
    "estado" "EstadoAnimal" NOT NULL DEFAULT 'ACTIVO',
    "estadoSanitario" "EstadoSanitario" NOT NULL DEFAULT 'SANO',
    "observaciones" TEXT,
    "fechaIngreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaEgreso" TIMESTAMP(3),
    "motivoEgreso" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "fincaId" TEXT NOT NULL,
    "loteId" TEXT,
    "razaId" TEXT NOT NULL,
    "padreId" TEXT,
    "madreId" TEXT,

    CONSTRAINT "animales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historiales_medicos" (
    "id" TEXT NOT NULL,
    "fechaConsulta" TIMESTAMP(3) NOT NULL,
    "motivoConsulta" TEXT NOT NULL,
    "sintomasObservados" TEXT,
    "diagnostico" TEXT NOT NULL,
    "pronostico" TEXT,
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "animalId" TEXT NOT NULL,
    "veterinarioId" TEXT NOT NULL,

    CONSTRAINT "historiales_medicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enfermedades_diagnosticadas" (
    "id" TEXT NOT NULL,
    "nombreEnfermedad" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaResolucion" TIMESTAMP(3),
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "descripcionClinica" TEXT,
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "historialMedicoId" TEXT NOT NULL,

    CONSTRAINT "enfermedades_diagnosticadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tratamientos" (
    "id" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "dosis" TEXT NOT NULL,
    "viaAdministracion" TEXT NOT NULL,
    "frecuencia" TEXT NOT NULL,
    "duracionDias" INTEGER,
    "estado" "EstadoTratamiento" NOT NULL DEFAULT 'EN_CURSO',
    "respuestaTratamiento" TEXT,
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "historialMedicoId" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,

    CONSTRAINT "tratamientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendarios_vacunacion" (
    "id" TEXT NOT NULL,
    "nombreVacuna" TEXT NOT NULL,
    "descripcion" TEXT,
    "fabricante" TEXT,
    "intervaloDias" INTEGER NOT NULL,
    "edadMinimasDias" INTEGER,
    "aplicaASexo" "Sexo",
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "medicamentoId" TEXT,

    CONSTRAINT "calendarios_vacunacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_vacunacion" (
    "id" TEXT NOT NULL,
    "fechaAplicacion" TIMESTAMP(3) NOT NULL,
    "dosis" TEXT,
    "viaAdministracion" TEXT,
    "lote" TEXT,
    "proximaFecha" TIMESTAMP(3),
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "historialMedicoId" TEXT,
    "calendarioVacunacionId" TEXT NOT NULL,
    "medicamentoId" TEXT,
    "aplicadoPorId" TEXT NOT NULL,

    CONSTRAINT "registros_vacunacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_reproductivos" (
    "id" TEXT NOT NULL,
    "tipo" "TipoEventoReproductivo" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT,
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "animalId" TEXT NOT NULL,
    "registradoPorId" TEXT NOT NULL,

    CONSTRAINT "eventos_reproductivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inseminaciones_artificiales" (
    "id" TEXT NOT NULL,
    "tipo" "TipoInseminacion" NOT NULL DEFAULT 'SEMEN_CONGELADO',
    "fechaInseminacion" TIMESTAMP(3) NOT NULL,
    "numeroIntento" INTEGER NOT NULL DEFAULT 1,
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventoReproductivoId" TEXT NOT NULL,
    "inventarioSemenId" TEXT,

    CONSTRAINT "inseminaciones_artificiales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnosticos_gestacion" (
    "id" TEXT NOT NULL,
    "fechaDiagnostico" TIMESTAMP(3) NOT NULL,
    "resultado" "ResultadoDiagnosticoGestacion" NOT NULL,
    "metodoDiagnostico" TEXT,
    "semanaGestacion" INTEGER,
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventoReproductivoId" TEXT NOT NULL,
    "gestacionId" TEXT,

    CONSTRAINT "diagnosticos_gestacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gestaciones" (
    "id" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaPartoEsperado" TIMESTAMP(3) NOT NULL,
    "fechaPartoReal" TIMESTAMP(3),
    "estadoGestacion" "EstadoGestacion" NOT NULL DEFAULT 'EN_CURSO',
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "madreId" TEXT NOT NULL,

    CONSTRAINT "gestaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nacimientos" (
    "id" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "tipoParto" "TipoParto" NOT NULL DEFAULT 'NORMAL',
    "pesoAlNacer" DOUBLE PRECISION,
    "estadoCria" "EstadoCria" NOT NULL DEFAULT 'VIVO',
    "sexoCria" "Sexo",
    "observaciones" TEXT,
    "complicaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gestacionId" TEXT NOT NULL,
    "criaId" TEXT,

    CONSTRAINT "nacimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sementales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "registro" TEXT,
    "origen" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "razaId" TEXT NOT NULL,

    CONSTRAINT "sementales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario_semen" (
    "id" TEXT NOT NULL,
    "codigoDosis" TEXT NOT NULL,
    "fechaColeccion" TIMESTAMP(3),
    "fechaVencimiento" TIMESTAMP(3),
    "cantidadDosis" INTEGER NOT NULL DEFAULT 1,
    "cantidadUsada" INTEGER NOT NULL DEFAULT 0,
    "motivilidad" DOUBLE PRECISION,
    "concentracion" DOUBLE PRECISION,
    "volumen" DOUBLE PRECISION,
    "coloracion" TEXT,
    "observaciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "sementalId" TEXT NOT NULL,

    CONSTRAINT "inventario_semen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispositivos_gps" (
    "id" TEXT NOT NULL,
    "codigoDispositivo" TEXT NOT NULL,
    "modelo" TEXT,
    "fabricante" TEXT,
    "frecuenciaActualizacion" INTEGER NOT NULL DEFAULT 3600,
    "estado" "EstadoDispositivoGPS" NOT NULL DEFAULT 'ACTIVO',
    "nivelBateria" INTEGER,
    "ultimaConexion" TIMESTAMP(3),
    "apiKey" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "animalId" TEXT NOT NULL,

    CONSTRAINT "dispositivos_gps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_ubicacion" (
    "id" TEXT NOT NULL,
    "latitud" DOUBLE PRECISION NOT NULL,
    "longitud" DOUBLE PRECISION NOT NULL,
    "altitud" DOUBLE PRECISION,
    "precision" DOUBLE PRECISION,
    "velocidad" DOUBLE PRECISION,
    "rumbo" DOUBLE PRECISION,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "esDatoSimulado" BOOLEAN NOT NULL DEFAULT false,
    "animalId" TEXT NOT NULL,
    "dispositivoGPSId" TEXT,

    CONSTRAINT "registros_ubicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "contrasena" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'ACTIVO',
    "telefono" TEXT,
    "cedulaIdentidad" TEXT,
    "cargo" TEXT,
    "ultimoAcceso" TIMESTAMP(3),
    "intentosFallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoHasta" TIMESTAMP(3),
    "tokenRefresh" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPorId" TEXT,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reglas_alerta" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipoAlerta" "TipoAlertaRegla" NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "prioridad" "PrioridadAlerta" NOT NULL DEFAULT 'MEDIA',
    "umbralValor" DOUBLE PRECISION,
    "umbralUnidad" TEXT,
    "notificarAdministrador" BOOLEAN NOT NULL DEFAULT true,
    "notificarVeterinario" BOOLEAN NOT NULL DEFAULT true,
    "notificarTecnico" BOOLEAN NOT NULL DEFAULT false,
    "enviarCorreo" BOOLEAN NOT NULL DEFAULT true,
    "evaluarCadaHoras" INTEGER NOT NULL DEFAULT 24,
    "ultimaEvaluacion" TIMESTAMP(3),
    "mensajeAlerta" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPorId" TEXT NOT NULL,

    CONSTRAINT "reglas_alerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "prioridad" "PrioridadAlerta" NOT NULL,
    "estado" "EstadoNotificacion" NOT NULL DEFAULT 'PENDIENTE',
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fechaLeida" TIMESTAMP(3),
    "correoEnviado" BOOLEAN NOT NULL DEFAULT false,
    "fechaCorreo" TIMESTAMP(3),
    "entidadTipo" TEXT,
    "entidadId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    "reglaId" TEXT,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_auditoria" (
    "id" TEXT NOT NULL,
    "accion" "TipoAccionAuditoria" NOT NULL,
    "modulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "entidadTipo" TEXT,
    "entidadId" TEXT,
    "datosAnteriores" JSONB,
    "datosNuevos" JSONB,
    "direccionIP" TEXT,
    "agenteUsuario" TEXT,
    "exitosa" BOOLEAN NOT NULL DEFAULT true,
    "errorMensaje" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT,

    CONSTRAINT "registros_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fincas_nombre_key" ON "fincas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "lotes_nombre_fincaId_key" ON "lotes"("nombre", "fincaId");

-- CreateIndex
CREATE UNIQUE INDEX "razas_nombre_key" ON "razas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "animales_numeroArete_key" ON "animales"("numeroArete");

-- CreateIndex
CREATE INDEX "animales_fincaId_idx" ON "animales"("fincaId");

-- CreateIndex
CREATE INDEX "animales_loteId_idx" ON "animales"("loteId");

-- CreateIndex
CREATE INDEX "animales_razaId_idx" ON "animales"("razaId");

-- CreateIndex
CREATE INDEX "animales_estado_idx" ON "animales"("estado");

-- CreateIndex
CREATE INDEX "animales_estadoSanitario_idx" ON "animales"("estadoSanitario");

-- CreateIndex
CREATE INDEX "animales_numeroArete_idx" ON "animales"("numeroArete");

-- CreateIndex
CREATE INDEX "historiales_medicos_animalId_idx" ON "historiales_medicos"("animalId");

-- CreateIndex
CREATE INDEX "historiales_medicos_veterinarioId_idx" ON "historiales_medicos"("veterinarioId");

-- CreateIndex
CREATE INDEX "historiales_medicos_fechaConsulta_idx" ON "historiales_medicos"("fechaConsulta");

-- CreateIndex
CREATE INDEX "enfermedades_diagnosticadas_historialMedicoId_idx" ON "enfermedades_diagnosticadas"("historialMedicoId");

-- CreateIndex
CREATE INDEX "enfermedades_diagnosticadas_activa_idx" ON "enfermedades_diagnosticadas"("activa");

-- CreateIndex
CREATE INDEX "enfermedades_diagnosticadas_nombreEnfermedad_idx" ON "enfermedades_diagnosticadas"("nombreEnfermedad");

-- CreateIndex
CREATE INDEX "tratamientos_historialMedicoId_idx" ON "tratamientos"("historialMedicoId");

-- CreateIndex
CREATE INDEX "tratamientos_medicamentoId_idx" ON "tratamientos"("medicamentoId");

-- CreateIndex
CREATE INDEX "tratamientos_estado_idx" ON "tratamientos"("estado");

-- CreateIndex
CREATE INDEX "registros_vacunacion_historialMedicoId_idx" ON "registros_vacunacion"("historialMedicoId");

-- CreateIndex
CREATE INDEX "registros_vacunacion_calendarioVacunacionId_idx" ON "registros_vacunacion"("calendarioVacunacionId");

-- CreateIndex
CREATE INDEX "registros_vacunacion_fechaAplicacion_idx" ON "registros_vacunacion"("fechaAplicacion");

-- CreateIndex
CREATE INDEX "eventos_reproductivos_animalId_idx" ON "eventos_reproductivos"("animalId");

-- CreateIndex
CREATE INDEX "eventos_reproductivos_tipo_idx" ON "eventos_reproductivos"("tipo");

-- CreateIndex
CREATE INDEX "eventos_reproductivos_fecha_idx" ON "eventos_reproductivos"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "inseminaciones_artificiales_eventoReproductivoId_key" ON "inseminaciones_artificiales"("eventoReproductivoId");

-- CreateIndex
CREATE UNIQUE INDEX "diagnosticos_gestacion_eventoReproductivoId_key" ON "diagnosticos_gestacion"("eventoReproductivoId");

-- CreateIndex
CREATE INDEX "gestaciones_madreId_idx" ON "gestaciones"("madreId");

-- CreateIndex
CREATE INDEX "gestaciones_estadoGestacion_idx" ON "gestaciones"("estadoGestacion");

-- CreateIndex
CREATE INDEX "gestaciones_fechaPartoEsperado_idx" ON "gestaciones"("fechaPartoEsperado");

-- CreateIndex
CREATE UNIQUE INDEX "nacimientos_criaId_key" ON "nacimientos"("criaId");

-- CreateIndex
CREATE INDEX "nacimientos_gestacionId_idx" ON "nacimientos"("gestacionId");

-- CreateIndex
CREATE UNIQUE INDEX "sementales_registro_key" ON "sementales"("registro");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_semen_codigoDosis_key" ON "inventario_semen"("codigoDosis");

-- CreateIndex
CREATE INDEX "inventario_semen_sementalId_idx" ON "inventario_semen"("sementalId");

-- CreateIndex
CREATE INDEX "inventario_semen_activo_idx" ON "inventario_semen"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "dispositivos_gps_codigoDispositivo_key" ON "dispositivos_gps"("codigoDispositivo");

-- CreateIndex
CREATE UNIQUE INDEX "dispositivos_gps_apiKey_key" ON "dispositivos_gps"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "dispositivos_gps_animalId_key" ON "dispositivos_gps"("animalId");

-- CreateIndex
CREATE INDEX "registros_ubicacion_animalId_idx" ON "registros_ubicacion"("animalId");

-- CreateIndex
CREATE INDEX "registros_ubicacion_fechaRegistro_idx" ON "registros_ubicacion"("fechaRegistro");

-- CreateIndex
CREATE INDEX "registros_ubicacion_animalId_fechaRegistro_idx" ON "registros_ubicacion"("animalId", "fechaRegistro");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cedulaIdentidad_key" ON "usuarios"("cedulaIdentidad");

-- CreateIndex
CREATE INDEX "usuarios_correo_idx" ON "usuarios"("correo");

-- CreateIndex
CREATE INDEX "usuarios_rol_idx" ON "usuarios"("rol");

-- CreateIndex
CREATE INDEX "usuarios_estado_idx" ON "usuarios"("estado");

-- CreateIndex
CREATE INDEX "notificaciones_usuarioId_idx" ON "notificaciones"("usuarioId");

-- CreateIndex
CREATE INDEX "notificaciones_estado_idx" ON "notificaciones"("estado");

-- CreateIndex
CREATE INDEX "notificaciones_leida_idx" ON "notificaciones"("leida");

-- CreateIndex
CREATE INDEX "notificaciones_creadoEn_idx" ON "notificaciones"("creadoEn");

-- CreateIndex
CREATE INDEX "registros_auditoria_usuarioId_idx" ON "registros_auditoria"("usuarioId");

-- CreateIndex
CREATE INDEX "registros_auditoria_modulo_idx" ON "registros_auditoria"("modulo");

-- CreateIndex
CREATE INDEX "registros_auditoria_creadoEn_idx" ON "registros_auditoria"("creadoEn");

-- CreateIndex
CREATE INDEX "registros_auditoria_entidadTipo_entidadId_idx" ON "registros_auditoria"("entidadTipo", "entidadId");

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "fincas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "potreros" ADD CONSTRAINT "potreros_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "lotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animales" ADD CONSTRAINT "animales_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "fincas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animales" ADD CONSTRAINT "animales_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animales" ADD CONSTRAINT "animales_razaId_fkey" FOREIGN KEY ("razaId") REFERENCES "razas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animales" ADD CONSTRAINT "animales_padreId_fkey" FOREIGN KEY ("padreId") REFERENCES "animales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animales" ADD CONSTRAINT "animales_madreId_fkey" FOREIGN KEY ("madreId") REFERENCES "animales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historiales_medicos" ADD CONSTRAINT "historiales_medicos_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historiales_medicos" ADD CONSTRAINT "historiales_medicos_veterinarioId_fkey" FOREIGN KEY ("veterinarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enfermedades_diagnosticadas" ADD CONSTRAINT "enfermedades_diagnosticadas_historialMedicoId_fkey" FOREIGN KEY ("historialMedicoId") REFERENCES "historiales_medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tratamientos" ADD CONSTRAINT "tratamientos_historialMedicoId_fkey" FOREIGN KEY ("historialMedicoId") REFERENCES "historiales_medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tratamientos" ADD CONSTRAINT "tratamientos_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "medicamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendarios_vacunacion" ADD CONSTRAINT "calendarios_vacunacion_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "medicamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_vacunacion" ADD CONSTRAINT "registros_vacunacion_historialMedicoId_fkey" FOREIGN KEY ("historialMedicoId") REFERENCES "historiales_medicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_vacunacion" ADD CONSTRAINT "registros_vacunacion_calendarioVacunacionId_fkey" FOREIGN KEY ("calendarioVacunacionId") REFERENCES "calendarios_vacunacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_vacunacion" ADD CONSTRAINT "registros_vacunacion_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "medicamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_vacunacion" ADD CONSTRAINT "registros_vacunacion_aplicadoPorId_fkey" FOREIGN KEY ("aplicadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_reproductivos" ADD CONSTRAINT "eventos_reproductivos_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_reproductivos" ADD CONSTRAINT "eventos_reproductivos_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inseminaciones_artificiales" ADD CONSTRAINT "inseminaciones_artificiales_eventoReproductivoId_fkey" FOREIGN KEY ("eventoReproductivoId") REFERENCES "eventos_reproductivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inseminaciones_artificiales" ADD CONSTRAINT "inseminaciones_artificiales_inventarioSemenId_fkey" FOREIGN KEY ("inventarioSemenId") REFERENCES "inventario_semen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos_gestacion" ADD CONSTRAINT "diagnosticos_gestacion_eventoReproductivoId_fkey" FOREIGN KEY ("eventoReproductivoId") REFERENCES "eventos_reproductivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos_gestacion" ADD CONSTRAINT "diagnosticos_gestacion_gestacionId_fkey" FOREIGN KEY ("gestacionId") REFERENCES "gestaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestaciones" ADD CONSTRAINT "gestaciones_madreId_fkey" FOREIGN KEY ("madreId") REFERENCES "animales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nacimientos" ADD CONSTRAINT "nacimientos_gestacionId_fkey" FOREIGN KEY ("gestacionId") REFERENCES "gestaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nacimientos" ADD CONSTRAINT "nacimientos_criaId_fkey" FOREIGN KEY ("criaId") REFERENCES "animales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sementales" ADD CONSTRAINT "sementales_razaId_fkey" FOREIGN KEY ("razaId") REFERENCES "razas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_semen" ADD CONSTRAINT "inventario_semen_sementalId_fkey" FOREIGN KEY ("sementalId") REFERENCES "sementales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispositivos_gps" ADD CONSTRAINT "dispositivos_gps_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_ubicacion" ADD CONSTRAINT "registros_ubicacion_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_ubicacion" ADD CONSTRAINT "registros_ubicacion_dispositivoGPSId_fkey" FOREIGN KEY ("dispositivoGPSId") REFERENCES "dispositivos_gps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reglas_alerta" ADD CONSTRAINT "reglas_alerta_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_reglaId_fkey" FOREIGN KEY ("reglaId") REFERENCES "reglas_alerta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_auditoria" ADD CONSTRAINT "registros_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
