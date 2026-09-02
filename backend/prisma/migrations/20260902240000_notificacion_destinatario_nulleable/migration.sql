-- El destinatario de una notificación se identifica de una sola forma, nunca
-- ambas ni ninguna: directamente por usuario_id (notificación de sistema sin
-- regla, p.ej. un correo de bienvenida) o, si nace de una regla de alerta,
-- por regla_usuario_id — la asignación regla-usuario de la que se deriva el
-- destinatario. Antes usuario_id era obligatorio; ahora pasa a ser opcional,
-- igual que regla_usuario_id, y un CHECK garantiza que exactamente uno de
-- los dos esté presente.

ALTER TABLE "notificacion" ALTER COLUMN "usuarioId" DROP NOT NULL;

ALTER TABLE "notificacion"
  ADD CONSTRAINT "notificacion_destinatario_unico"
  CHECK (("usuarioId" IS NOT NULL) <> ("regla_usuario_id" IS NOT NULL));

-- Borrar la asignación regla-usuario que originó una notificación dejaba
-- antes la notificación huérfana (SET NULL); ahora eso violaría el CHECK, así
-- que se elimina en cascada junto con la asignación que le dio origen.
ALTER TABLE "notificacion" DROP CONSTRAINT "notificacion_regla_usuario_id_fkey";
ALTER TABLE "notificacion"
  ADD CONSTRAINT "notificacion_regla_usuario_id_fkey"
  FOREIGN KEY ("regla_usuario_id") REFERENCES "regla_usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
