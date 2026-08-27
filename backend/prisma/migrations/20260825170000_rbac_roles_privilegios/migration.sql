-- ============================================================
-- RBAC: Roles y Privilegios dinámicos
-- Reemplaza el enum fijo "RolUsuario" por tablas roles/privilegios/
-- rol_privilegio, y migra los usuarios existentes sin pérdida de datos.
-- ============================================================

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "privilegios" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "privilegios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rol_privilegio" (
    "rolId" TEXT NOT NULL,
    "privilegioId" TEXT NOT NULL,

    CONSTRAINT "rol_privilegio_pkey" PRIMARY KEY ("rolId","privilegioId")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "privilegios_descripcion_key" ON "privilegios"("descripcion");

-- AddForeignKey
ALTER TABLE "rol_privilegio" ADD CONSTRAINT "rol_privilegio_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_privilegio" ADD CONSTRAINT "rol_privilegio_privilegioId_fkey" FOREIGN KEY ("privilegioId") REFERENCES "privilegios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- Datos de referencia: los 3 roles históricos y el catálogo de
-- privilegios que el backend verifica en cada ruta.
-- ============================================================

INSERT INTO "roles" ("id", "nombre", "descripcion", "actualizadoEn") VALUES
    ('rol_administrador', 'ADMINISTRADOR', 'Acceso total al sistema', CURRENT_TIMESTAMP),
    ('rol_veterinario',   'VETERINARIO',   'Gestión clínica y operativa', CURRENT_TIMESTAMP),
    ('rol_tecnico',       'TECNICO',       'Operaciones básicas de campo', CURRENT_TIMESTAMP);

INSERT INTO "privilegios" ("id", "descripcion") VALUES
    ('priv_usuarios_ver',                          'usuarios.ver'),
    ('priv_usuarios_crear',                        'usuarios.crear'),
    ('priv_usuarios_editar',                       'usuarios.editar'),
    ('priv_usuarios_eliminar',                     'usuarios.eliminar'),
    ('priv_usuarios_desbloquear',                  'usuarios.desbloquear'),
    ('priv_roles_gestionar',                       'roles.gestionar'),
    ('priv_auditoria_ver',                         'auditoria.ver'),
    ('priv_fincas_ver',                            'fincas.ver'),
    ('priv_fincas_crear',                          'fincas.crear'),
    ('priv_fincas_editar',                         'fincas.editar'),
    ('priv_fincas_eliminar',                       'fincas.eliminar'),
    ('priv_lotes_ver',                             'lotes.ver'),
    ('priv_lotes_crear',                           'lotes.crear'),
    ('priv_lotes_editar',                          'lotes.editar'),
    ('priv_lotes_eliminar',                        'lotes.eliminar'),
    ('priv_animales_ver',                          'animales.ver'),
    ('priv_animales_crear',                        'animales.crear'),
    ('priv_animales_editar',                       'animales.editar'),
    ('priv_animales_eliminar',                     'animales.eliminar'),
    ('priv_historial_medico_ver',                  'historial_medico.ver'),
    ('priv_historial_medico_crear',                'historial_medico.crear'),
    ('priv_historial_medico_eliminar',              'historial_medico.eliminar'),
    ('priv_vacunacion_ver',                        'vacunacion.ver'),
    ('priv_vacunacion_registrar',                  'vacunacion.registrar'),
    ('priv_vacunacion_gestionar_calendario',       'vacunacion.gestionar_calendario'),
    ('priv_reproduccion_ver',                      'reproduccion.ver'),
    ('priv_reproduccion_crear',                    'reproduccion.crear'),
    ('priv_inseminacion_ver',                      'inseminacion.ver'),
    ('priv_inseminacion_crear',                    'inseminacion.crear'),
    ('priv_geolocalizacion_ver',                   'geolocalizacion.ver'),
    ('priv_geolocalizacion_gestionar_dispositivos','geolocalizacion.gestionar_dispositivos'),
    ('priv_alertas_ver',                           'alertas.ver'),
    ('priv_alertas_evaluar',                       'alertas.evaluar'),
    ('priv_alertas_gestionar_reglas',              'alertas.gestionar_reglas'),
    ('priv_reportes_generar',                      'reportes.generar'),
    ('priv_analytics_ver',                         'analytics.ver'),
    ('priv_analytics_ver_avanzado',                'analytics.ver_avanzado');

-- ADMINISTRADOR: todos los privilegios
INSERT INTO "rol_privilegio" ("rolId", "privilegioId")
SELECT 'rol_administrador', "id" FROM "privilegios";

-- VETERINARIO: gestión clínica y operativa (sin usuarios, roles, auditoría,
-- ni las acciones administrativas exclusivas de cada módulo)
INSERT INTO "rol_privilegio" ("rolId", "privilegioId") VALUES
    ('rol_veterinario', 'priv_fincas_ver'),
    ('rol_veterinario', 'priv_fincas_editar'),
    ('rol_veterinario', 'priv_lotes_ver'),
    ('rol_veterinario', 'priv_lotes_crear'),
    ('rol_veterinario', 'priv_lotes_editar'),
    ('rol_veterinario', 'priv_animales_ver'),
    ('rol_veterinario', 'priv_animales_crear'),
    ('rol_veterinario', 'priv_animales_editar'),
    ('rol_veterinario', 'priv_historial_medico_ver'),
    ('rol_veterinario', 'priv_historial_medico_crear'),
    ('rol_veterinario', 'priv_vacunacion_ver'),
    ('rol_veterinario', 'priv_vacunacion_registrar'),
    ('rol_veterinario', 'priv_reproduccion_ver'),
    ('rol_veterinario', 'priv_reproduccion_crear'),
    ('rol_veterinario', 'priv_inseminacion_ver'),
    ('rol_veterinario', 'priv_inseminacion_crear'),
    ('rol_veterinario', 'priv_geolocalizacion_ver'),
    ('rol_veterinario', 'priv_geolocalizacion_gestionar_dispositivos'),
    ('rol_veterinario', 'priv_alertas_ver'),
    ('rol_veterinario', 'priv_alertas_evaluar'),
    ('rol_veterinario', 'priv_reportes_generar'),
    ('rol_veterinario', 'priv_analytics_ver'),
    ('rol_veterinario', 'priv_analytics_ver_avanzado');

-- TECNICO: solo consulta de los módulos operativos
INSERT INTO "rol_privilegio" ("rolId", "privilegioId") VALUES
    ('rol_tecnico', 'priv_fincas_ver'),
    ('rol_tecnico', 'priv_lotes_ver'),
    ('rol_tecnico', 'priv_animales_ver'),
    ('rol_tecnico', 'priv_historial_medico_ver'),
    ('rol_tecnico', 'priv_vacunacion_ver'),
    ('rol_tecnico', 'priv_reproduccion_ver'),
    ('rol_tecnico', 'priv_inseminacion_ver'),
    ('rol_tecnico', 'priv_geolocalizacion_ver'),
    ('rol_tecnico', 'priv_alertas_ver'),
    ('rol_tecnico', 'priv_analytics_ver');

-- ============================================================
-- Migrar "usuarios" del enum "rol" fijo a la nueva relación "rolId"
-- ============================================================

-- AlterTable: agregar la nueva columna (todavía nullable, para poder rellenarla)
ALTER TABLE "usuarios" ADD COLUMN "rolId" TEXT;

-- Backfill: mapear cada usuario existente a su rol equivalente
UPDATE "usuarios" SET "rolId" = 'rol_administrador' WHERE "rol" = 'ADMINISTRADOR';
UPDATE "usuarios" SET "rolId" = 'rol_veterinario'   WHERE "rol" = 'VETERINARIO';
UPDATE "usuarios" SET "rolId" = 'rol_tecnico'       WHERE "rol" = 'TECNICO';

-- Ahora que todos los usuarios tienen un rolId, la columna puede ser NOT NULL
ALTER TABLE "usuarios" ALTER COLUMN "rolId" SET NOT NULL;

-- DropIndex (del enum "rol")
DROP INDEX "usuarios_rol_idx";

-- AlterTable: eliminar la columna del enum
ALTER TABLE "usuarios" DROP COLUMN "rol";

-- DropEnum
DROP TYPE "RolUsuario";

-- CreateIndex (para la nueva relación)
CREATE INDEX "usuarios_rolId_idx" ON "usuarios"("rolId");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
