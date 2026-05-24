-- =============================================
-- MIGRATION: Fusión MOD_PAYMENTS → MOD_INVOICING
-- Fecha: 2026-05-24
-- Descripción: Los cobros de facturas pasan a estar
--   cubiertos por MOD_INVOICING. MOD_PAYMENTS se elimina.
-- =============================================

SET search_path TO erp;

-- 1. Para empresas que tienen MOD_PAYMENTS activo pero NO tienen MOD_INVOICING,
--    reasignar el registro a MOD_INVOICING.
UPDATE company_modules cm
SET module_id = (SELECT id FROM modules WHERE code = 'MOD_INVOICING')
WHERE cm.module_id = (SELECT id FROM modules WHERE code = 'MOD_PAYMENTS')
  AND NOT EXISTS (
      SELECT 1 FROM company_modules cm2
      WHERE cm2.company_id = cm.company_id
        AND cm2.module_id  = (SELECT id FROM modules WHERE code = 'MOD_INVOICING')
  );

-- 2. Para empresas que ya tienen MOD_INVOICING Y MOD_PAYMENTS (duplicado),
--    eliminar la fila redundante de MOD_PAYMENTS.
DELETE FROM company_modules
WHERE module_id = (SELECT id FROM modules WHERE code = 'MOD_PAYMENTS');

-- 3. Eliminar el módulo MOD_PAYMENTS del catálogo.
DELETE FROM modules WHERE code = 'MOD_PAYMENTS';
