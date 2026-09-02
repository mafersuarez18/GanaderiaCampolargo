-- Inicialización de PostgreSQL para el Sistema Campolargo
-- Este script se ejecuta automáticamente al crear el contenedor por primera vez

-- Extensión para búsquedas de texto en español
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Extensión para generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
