-- ============================================================
-- Privilegios del nuevo módulo de Plan Sanitario.
-- ============================================================

INSERT INTO "privilegio" ("id", "descripcion") VALUES
    ('priv_plan_sanitario_ver',        'plan_sanitario.ver'),
    ('priv_plan_sanitario_gestionar',  'plan_sanitario.gestionar');

-- ADMINISTRADOR: todos los privilegios (igual que con el resto de módulos)
INSERT INTO "rol_privilegio" ("rol_id", "privilegio_id") VALUES
    ('rol_administrador', 'priv_plan_sanitario_ver'),
    ('rol_administrador', 'priv_plan_sanitario_gestionar');

-- VETERINARIO: diseña y mantiene el plan sanitario anual de cada finca
INSERT INTO "rol_privilegio" ("rol_id", "privilegio_id") VALUES
    ('rol_veterinario', 'priv_plan_sanitario_ver'),
    ('rol_veterinario', 'priv_plan_sanitario_gestionar');

-- TECNICO: solo consulta, igual que en el resto de módulos operativos
INSERT INTO "rol_privilegio" ("rol_id", "privilegio_id") VALUES
    ('rol_tecnico', 'priv_plan_sanitario_ver');
