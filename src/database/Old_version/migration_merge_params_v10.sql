-- =============================================
-- MIGRATION v10 — Fusión MOD_SUPPLIERS + MOD_REPORTS + MOD_AUDIT → MOD_PARAMS
-- Módulo unificado: "Parámetros del Sistema"
-- Ejecutar en orden sobre la base existente
-- =============================================

SET search_path TO erp;

-- ── 1. Crear el nuevo módulo MOD_PARAMS ──────────────────────────────────────
INSERT INTO modules (code, name, description)
VALUES (
    'MOD_PARAMS',
    'Parámetros del Sistema',
    'Gestión de proveedores, reportes y auditoría de la empresa.'
)
ON CONFLICT (code) DO NOTHING;

-- ── 2. Migrar company_modules ─────────────────────────────────────────────────
-- Para cada empresa que tenga MOD_SUPPLIERS, MOD_REPORTS o MOD_AUDIT activos,
-- crear (si no existe) un registro MOD_PARAMS con is_active = TRUE.

INSERT INTO company_modules (company_id, module_id, is_active, approved_by, approved_at)
SELECT DISTINCT
    cm.company_id,
    (SELECT id FROM modules WHERE code = 'MOD_PARAMS'),
    TRUE,
    cm.approved_by,
    NOW()
FROM company_modules cm
JOIN modules m ON m.id = cm.module_id AND m.code IN ('MOD_SUPPLIERS', 'MOD_REPORTS', 'MOD_AUDIT', 'MOD_TAX')
WHERE NOT EXISTS (
    SELECT 1 FROM company_modules cm2
    WHERE cm2.company_id = cm.company_id
      AND cm2.module_id  = (SELECT id FROM modules WHERE code = 'MOD_PARAMS')
);

-- ── 3. Eliminar registros obsoletos de company_modules ────────────────────────
DELETE FROM company_modules
WHERE module_id IN (
    SELECT id FROM modules WHERE code IN ('MOD_SUPPLIERS', 'MOD_REPORTS', 'MOD_AUDIT', 'MOD_TAX')
);

-- ── 4. Limpiar company_module_requests (si existen solicitudes pendientes) ────
DELETE FROM company_module_requests
WHERE module_id IN (
    SELECT id FROM modules WHERE code IN ('MOD_SUPPLIERS', 'MOD_REPORTS', 'MOD_AUDIT', 'MOD_TAX')
);

-- ── 5. Eliminar los módulos del catálogo ─────────────────────────────────────
DELETE FROM modules WHERE code IN ('MOD_SUPPLIERS', 'MOD_REPORTS', 'MOD_AUDIT', 'MOD_TAX');
