-- Se elimina regla_alerta.mensajeAlerta: era una plantilla opcional para el
-- título de las notificaciones generadas por esa regla. El motor de alertas
-- ya tiene un texto por defecto hardcodeado para cada tipo de alerta, así que
-- el contenido real que ve el usuario sigue viviendo únicamente en
-- notificacion.mensaje (el único campo de mensaje que se conserva).
ALTER TABLE "regla_alerta" DROP COLUMN "mensajeAlerta";
