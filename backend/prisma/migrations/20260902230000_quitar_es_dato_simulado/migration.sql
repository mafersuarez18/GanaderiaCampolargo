-- Se quita la distinción entre ubicaciones GPS "simuladas" y reales: todo
-- registro de ubicación se trata igual, sin importar su origen.
ALTER TABLE "registro_ubicacion" DROP COLUMN "esDatoSimulado";
