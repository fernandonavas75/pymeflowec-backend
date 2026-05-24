-- =============================================
-- MIGRATION v9 — Categorías de productos + fusión MOD_PRODUCTS/MOD_INVENTORY
-- Ejecutar en la BD existente (no requiere recrear el schema)
-- =============================================

SET search_path TO erp;

-- ── 1. Tabla de categorías de productos ──────────────────────────────
CREATE TABLE IF NOT EXISTS erp.product_categories (
    id          BIGSERIAL PRIMARY KEY,
    company_id  BIGINT        NOT NULL REFERENCES erp.companies(id),
    name        VARCHAR(100)  NOT NULL,
    description TEXT,
    status      VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_product_categories_company ON erp.product_categories(company_id);

-- ── 2. Columna category_id en products ───────────────────────────────
ALTER TABLE erp.products
    ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES erp.product_categories(id);

CREATE INDEX IF NOT EXISTS idx_products_category ON erp.products(category_id);

-- ── 3. Fusión de módulos: eliminar MOD_INVENTORY, actualizar MOD_PRODUCTS ──

-- 3a. Migrar company_modules: asignar MOD_PRODUCTS a empresas que solo tenían MOD_INVENTORY
INSERT INTO erp.company_modules (company_id, module_id, is_active, approved_by, approved_at)
SELECT cm.company_id,
       (SELECT id FROM erp.modules WHERE code = 'MOD_PRODUCTS'),
       cm.is_active,
       cm.approved_by,
       cm.approved_at
FROM erp.company_modules cm
JOIN erp.modules m ON m.id = cm.module_id AND m.code = 'MOD_INVENTORY'
WHERE cm.company_id NOT IN (
    SELECT cm2.company_id
    FROM erp.company_modules cm2
    JOIN erp.modules m2 ON m2.id = cm2.module_id AND m2.code = 'MOD_PRODUCTS'
)
ON CONFLICT DO NOTHING;

-- 3b. Eliminar registros de MOD_INVENTORY en company_modules
DELETE FROM erp.company_modules
WHERE module_id = (SELECT id FROM erp.modules WHERE code = 'MOD_INVENTORY');

-- 3c. Eliminar registros de MOD_INVENTORY en company_module_requests (si existe la tabla)
DELETE FROM erp.company_module_requests
WHERE module_id = (SELECT id FROM erp.modules WHERE code = 'MOD_INVENTORY');

-- 3d. Actualizar nombre y descripción de MOD_PRODUCTS
UPDATE erp.modules
SET name        = 'Productos e Inventario',
    description = 'Catálogo de productos con categorías, precios y control de stock (entradas/salidas/ajustes).'
WHERE code = 'MOD_PRODUCTS';

-- 3e. Eliminar el módulo MOD_INVENTORY
DELETE FROM erp.modules WHERE code = 'MOD_INVENTORY';
