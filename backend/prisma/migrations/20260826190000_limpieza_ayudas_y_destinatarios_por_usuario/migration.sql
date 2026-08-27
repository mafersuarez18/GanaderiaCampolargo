-- ============================================================================
-- 1) Eliminar "ayudas_diagnosticas": no forma parte del modelo lógico del tomo
--    (Apéndice B.2) y estaba vacía (0 filas) al momento de esta migración.
-- ============================================================================
DROP TABLE "ayudas_diagnosticas";
DROP TYPE "TipoAyudaDiagnostica";

-- ============================================================================
-- 2) Reemplazar "regla_alerta_rol" (destinatarios por rol) por
--    "regla_alerta_usuario" (destinatarios por usuario específico, elegidos de
--    forma independiente de su rol, según el modelo lógico del tomo).
-- ============================================================================
CREATE TABLE "regla_alerta_usuario" (
    "reglaAlertaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "regla_alerta_usuario_pkey" PRIMARY KEY ("reglaAlertaId", "usuarioId")
);

ALTER TABLE "regla_alerta_usuario" ADD CONSTRAINT "regla_alerta_usuario_reglaAlertaId_fkey" FOREIGN KEY ("reglaAlertaId") REFERENCES "reglas_alerta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "regla_alerta_usuario" ADD CONSTRAINT "regla_alerta_usuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill sin pérdida de información: cada asignación (regla -> rol) se expande
-- a (regla -> usuario) para cada usuario que hoy tiene ese rol. A partir de aquí
-- la asignación queda fija por usuario, no se recalcula si el usuario cambia de rol.
INSERT INTO "regla_alerta_usuario" ("reglaAlertaId", "usuarioId")
SELECT DISTINCT rar."reglaAlertaId", u."id"
FROM "regla_alerta_rol" rar
JOIN "usuarios" u ON u."rolId" = rar."rolId"
ON CONFLICT DO NOTHING;

ALTER TABLE "regla_alerta_rol" DROP CONSTRAINT "regla_alerta_rol_reglaAlertaId_fkey";
ALTER TABLE "regla_alerta_rol" DROP CONSTRAINT "regla_alerta_rol_rolId_fkey";
DROP TABLE "regla_alerta_rol";
