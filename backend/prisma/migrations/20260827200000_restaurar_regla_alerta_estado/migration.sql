-- El tomo (Apéndice B.2, tabla REGLA_ALERTA) exige una columna "estado"
-- VARCHAR NOT NULL, distinta de "prioridad". La migración
-- 20260827190000_quitar_columnas_operativas_extra eliminó por error esta
-- columna al tratarla como el mismo patrón booleano de baja lógica
-- (activo/activa) que sí correspondía borrar en las otras 9 tablas.
--
-- Se restaura como VARCHAR libre (el tomo no define un CHECK de valores),
-- con los valores de aplicación "ACTIVA" / "PAUSADA", para recuperar
-- también la función de pausar/activar reglas individualmente.

ALTER TABLE "regla_alerta"
  ADD COLUMN "estado" VARCHAR NOT NULL DEFAULT 'ACTIVA';
