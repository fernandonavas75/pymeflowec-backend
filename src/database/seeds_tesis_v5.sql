-- =============================================
-- PYMEFLOWEC · SEEDS — SCHEMA v4 FINAL
-- Ejecutar DESPUÉS de schema_tesis_v4_final.sql
-- Contraseña demo: Admin2024! (bcryptjs 12 rounds)
-- =============================================

SET search_path TO erp;

-- =============================================
-- 1. ROLES
-- =============================================
INSERT INTO roles (name, scope, description) VALUES
    ('PLATFORM_ADMIN',   'PLATFORM', 'Administrador de la plataforma ERP. Gestiona compañías, módulos y usuarios de plataforma.'),
    ('PLATFORM_SUPPORT', 'PLATFORM', 'Soporte técnico. Acceso de lectura a logs y auditoría para diagnóstico.'),
    ('STORE_ADMIN',      'STORE',    'Administrador de tienda. Gestiona productos, trabajadores, impuestos y configuración.'),
    ('STORE_SELLER',     'STORE',    'Vendedor de tienda. Puede facturar, registrar clientes y consultar inventario.'),
    ('STORE_WAREHOUSE',  'STORE',    'Encargado de bodega. Gestiona inventario (entradas/salidas/ajustes de stock). No puede crear facturas.');

-- =============================================
-- 2. MÓDULOS
-- =============================================
INSERT INTO modules (code, name, description) VALUES
    ('MOD_INVOICING',  'Facturación',  'Creación de facturas y gestión de clientes de la tienda.'),
    ('MOD_INVENTORY',  'Inventario',   'Control de stock, movimientos de entrada/salida y alertas de mínimos.'),
    ('MOD_PRODUCTS',   'Productos',    'Catálogo de productos con precios de compra/venta y proveedor.'),
    ('MOD_SUPPLIERS',  'Proveedores',  'Registro y gestión de distribuidores/proveedores.'),
    ('MOD_TAX',        'Impuestos',    'Configuración de tasas de IVA y otros impuestos.'),
    ('MOD_REPORTS',    'Reportes',     'Reportes de ventas, inventario y movimientos.'),
    ('MOD_AUDIT',      'Auditoría',    'Visualización de logs de auditoría de la empresa.');

-- =============================================
-- 3. USUARIOS DE PLATAFORMA
-- Contraseña: Admin2024!
-- =============================================
INSERT INTO users (company_id, role_id, full_name, email, password_hash, status) VALUES
    (NULL,
     (SELECT id FROM roles WHERE name = 'PLATFORM_ADMIN'),
     'Admin Plataforma',
     'admin@pymeflowec.com',
     '$2b$12$W7GIURDx9cfjjxu2zUNgbOrSvMlPg97GKHIw5oVAWhHAJzIwpWkga',
     'ACTIVE'),
    (NULL,
     (SELECT id FROM roles WHERE name = 'PLATFORM_SUPPORT'),
     'Soporte Plataforma',
     'soporte@pymeflowec.com',
     '$2b$12$W7GIURDx9cfjjxu2zUNgbOrSvMlPg97GKHIw5oVAWhHAJzIwpWkga',
     'ACTIVE');

-- =============================================
-- 4. EMPRESA DE DEMOSTRACIÓN
-- =============================================
INSERT INTO companies (name, business_name, ruc, email, phone, address, status) VALUES
    ('Tienda Don Pepe', 'Don Pepe Abarrotes S.A.', '1790012345001',
     'donpepe@demo.com', '0987654321', 'Av. Amazonas N24-100, Quito', 'ACTIVE');

-- =============================================
-- 5. CONSUMIDOR FINAL (obligatorio por tenant)
-- =============================================
INSERT INTO store_customers (company_id, customer_type, document_number, full_name) VALUES
    ((SELECT id FROM companies WHERE ruc = '1790012345001'),
     'FINAL_CONSUMER', '9999999999999', 'Consumidor Final');

-- =============================================
-- 6. USUARIOS DE TIENDA
-- Contraseña: Admin2024!
-- =============================================
INSERT INTO users (company_id, role_id, full_name, email, password_hash, status) VALUES
    ((SELECT id FROM companies WHERE ruc = '1790012345001'),
     (SELECT id FROM roles WHERE name = 'STORE_ADMIN'),
     'José Pérez',
     'jose@donpepe.com',
     '$2b$12$W7GIURDx9cfjjxu2zUNgbOrSvMlPg97GKHIw5oVAWhHAJzIwpWkga',
     'ACTIVE'),
    ((SELECT id FROM companies WHERE ruc = '1790012345001'),
     (SELECT id FROM roles WHERE name = 'STORE_SELLER'),
     'María López',
     'maria@donpepe.com',
     '$2b$12$W7GIURDx9cfjjxu2zUNgbOrSvMlPg97GKHIw5oVAWhHAJzIwpWkga',
     'ACTIVE'),
    ((SELECT id FROM companies WHERE ruc = '1790012345001'),
     (SELECT id FROM roles WHERE name = 'STORE_WAREHOUSE'),
     'Pedro Almeida',
     'pedro@donpepe.com',
     '$2b$12$W7GIURDx9cfjjxu2zUNgbOrSvMlPg97GKHIw5oVAWhHAJzIwpWkga',
     'ACTIVE');

-- =============================================
-- 7. MÓDULOS ACTIVOS PARA LA DEMO
-- =============================================
INSERT INTO company_modules (company_id, module_id, is_active, approved_by, approved_at)
SELECT
    c.id,
    m.id,
    TRUE,
    (SELECT id FROM users WHERE email = 'admin@pymeflowec.com'),
    NOW()
FROM companies c
CROSS JOIN modules m
WHERE c.ruc = '1790012345001'
  AND m.code IN ('MOD_INVOICING','MOD_INVENTORY','MOD_PRODUCTS','MOD_SUPPLIERS','MOD_TAX');

-- =============================================
-- 8. TASA DE IVA VIGENTE (15% Ecuador)
-- =============================================
INSERT INTO tax_rates (company_id, tax_name, percentage, is_active, valid_from) VALUES
    ((SELECT id FROM companies WHERE ruc = '1790012345001'),
     'IVA 15%', 15.00, TRUE, '2024-04-01');

-- =============================================
-- 9. PROVEEDOR DEMO
-- =============================================
INSERT INTO suppliers (company_id, name, ruc, phone, email) VALUES
    ((SELECT id FROM companies WHERE ruc = '1790012345001'),
     'Distribuidora Nacional S.A.', '1791234567001', '0991234567', 'ventas@distnacional.com');

-- =============================================
-- 10. PRODUCTOS DEMO
-- =============================================
DO $$
DECLARE
    v_company_id  BIGINT;
    v_supplier_id BIGINT;
    v_tax_rate_id BIGINT;
BEGIN
    SELECT id INTO v_company_id  FROM erp.companies  WHERE ruc = '1790012345001';
    SELECT id INTO v_supplier_id FROM erp.suppliers  WHERE company_id = v_company_id AND ruc = '1791234567001';
    SELECT id INTO v_tax_rate_id FROM erp.tax_rates  WHERE company_id = v_company_id AND is_active = TRUE LIMIT 1;

    INSERT INTO erp.products (company_id, supplier_id, sku, name, purchase_price, sale_price, stock, min_stock, tax_rate_id) VALUES
        (v_company_id, v_supplier_id, 'ARR-001', 'Arroz 1kg',           0.85, 1.10, 50, 10, v_tax_rate_id),
        (v_company_id, v_supplier_id, 'ACE-001', 'Aceite 1L',           1.80, 2.50, 30,  5, v_tax_rate_id),
        (v_company_id, v_supplier_id, 'AZU-001', 'Azúcar 1kg',          0.75, 1.00, 40, 10, v_tax_rate_id),
        (v_company_id, v_supplier_id, 'LEH-001', 'Leche 1L',            0.90, 1.20, 25,  5, v_tax_rate_id),
        (v_company_id, v_supplier_id, 'FID-001', 'Fideos 500g',         0.50, 0.75, 60, 15, v_tax_rate_id),
        (v_company_id, v_supplier_id, 'ATU-001', 'Atún en lata',        1.20, 1.75, 35,  8, v_tax_rate_id),
        (v_company_id, v_supplier_id, 'JAB-001', 'Jabón de tocador',    0.45, 0.80, 40, 10, v_tax_rate_id),
        (v_company_id, v_supplier_id, 'PAP-001', 'Papel higiénico x4',  1.50, 2.20, 20,  5, v_tax_rate_id);
END $$;

-- =============================================
-- 11. CLIENTE DEMO
-- =============================================
INSERT INTO store_customers (company_id, customer_type, document_number, full_name, email, phone) VALUES
    ((SELECT id FROM companies WHERE ruc = '1790012345001'),
     'CEDULA', '1712345678', 'Carlos Mendoza', 'carlos@email.com', '0998765432');

-- =============================================
-- RESUMEN DE CREDENCIALES DEMO
-- =============================================
-- Usuario                   | Rol               | Email
-- --------------------------|-------------------|-----------------------------
-- Admin Plataforma          | PLATFORM_ADMIN    | admin@pymeflowec.com
-- Soporte Plataforma        | PLATFORM_SUPPORT  | soporte@pymeflowec.com
-- José Pérez (Don Pepe)     | STORE_ADMIN       | jose@donpepe.com
-- María López (Don Pepe)    | STORE_SELLER      | maria@donpepe.com
-- Pedro Almeida (Don Pepe)  | STORE_WAREHOUSE   | pedro@donpepe.com
--
-- Contraseña para todos: Admin2024!
-- Hash: $2b$12$W7GIURDx9cfjjxu2zUNgbOrSvMlPg97GKHIw5oVAWhHAJzIwpWkga
-- Generado con bcryptjs, 12 rounds (misma librería que el backend)
