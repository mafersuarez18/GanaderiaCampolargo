-- Inicialización de PostgreSQL para el Sistema Campolargo
-- Este script se ejecuta automáticamente al crear el contenedor por primera vez

-- Habilitar extensión PostGIS para datos geoespaciales (geolocalización del ganado)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Extensión para búsquedas de texto en español
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Extensión para generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verificar que PostGIS está activo
SELECT PostGIS_Full_Version();
