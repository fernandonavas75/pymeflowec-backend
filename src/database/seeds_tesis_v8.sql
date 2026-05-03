-- =============================================
-- PYMEFLOWEC · SEEDS v8 — UNIFICADO COMPLETO
-- PostgreSQL 15+
-- Ejecutar DESPUÉS de schema_tesis_v8.sql
-- Contraseña demo: Admin2024!
-- Hash bcryptjs 12 rounds:
--   $2b$12$W7GIURDx9cfjjxu2zUNgbOrSvMlPg97GKHIw5oVAWhHAJzIwpWkga
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
    ('STORE_WAREHOUSE',  'STORE',    'Encargado de bodega. Gestiona inventario (entradas/salidas/ajustes). No puede crear facturas.');

-- =============================================
-- 2. MÓDULOS
-- =============================================
INSERT INTO modules (code, name, description) VALUES
    ('MOD_INVOICING', 'Facturación',        'Creación de facturas y gestión de clientes de la tienda.'),
    ('MOD_INVENTORY', 'Inventario',         'Control de stock, movimientos de entrada/salida y alertas de mínimos.'),
    ('MOD_PRODUCTS',  'Productos',          'Catálogo de productos con precios de compra/venta y proveedor.'),
    ('MOD_SUPPLIERS', 'Proveedores',        'Registro y gestión de distribuidores/proveedores.'),
    ('MOD_TAX',       'Impuestos',          'Configuración de tasas de IVA y otros impuestos.'),
    ('MOD_REPORTS',   'Reportes',           'Reportes de ventas, inventario y movimientos.'),
    ('MOD_AUDIT',     'Auditoría',          'Visualización de logs de auditoría de la empresa.'),
    ('MOD_FINANCE',   'Módulo Financiero',  'Registro y seguimiento de egresos operacionales: arriendos, nómina, impuestos, etc.'),
    ('MOD_PAYMENTS',  'Pagos de Facturas',  'Gestión de cobros de facturas: efectivo, transferencia, tarjeta y pago en cuotas.');

-- =============================================
-- 3. USUARIOS DE PLATAFORMA
-- =============================================
INSERT INTO users (company_id, role_id, full_name, email, password_hash, status) VALUES
    (NULL,
     (SELECT id FROM roles WHERE name = 'PLATFORM_ADMIN'),
     'Admin Plataforma', 'admin@pymeflowec.com',
     '$2b$12$W7GIURDx9cfjjxu2zUNgbOrSvMlPg97GKHIw5oVAWhHAJzIwpWkga',
     'ACTIVE'),
    (NULL,
     (SELECT id FROM roles WHERE name = 'PLATFORM_SUPPORT'),
     'Soporte Plataforma', 'soporte@pymeflowec.com',
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
-- =============================================
INSERT INTO users (company_id, role_id, full_name, email, password_hash, status) VALUES
    ((SELECT id FROM companies WHERE ruc = '1790012345001'),
     (SELECT id FROM roles WHERE name = 'STORE_ADMIN'),
     'José Pérez', 'jose@donpepe.com',
     '$2b$12$W7GIURDx9cfjjxu2zUNgbOrSvMlPg97GKHIw5oVAWhHAJzIwpWkga', 'ACTIVE'),
    ((SELECT id FROM companies WHERE ruc = '1790012345001'),
     (SELECT id FROM roles WHERE name = 'STORE_SELLER'),
     'María López', 'maria@donpepe.com',
     '$2b$12$W7GIURDx9cfjjxu2zUNgbOrSvMlPg97GKHIw5oVAWhHAJzIwpWkga', 'ACTIVE'),
    ((SELECT id FROM companies WHERE ruc = '1790012345001'),
     (SELECT id FROM roles WHERE name = 'STORE_WAREHOUSE'),
     'Pedro Almeida', 'pedro@donpepe.com',
     '$2b$12$W7GIURDx9cfjjxu2zUNgbOrSvMlPg97GKHIw5oVAWhHAJzIwpWkga', 'ACTIVE');

-- =============================================
-- 7. MÓDULOS ACTIVOS PARA LA DEMO
-- =============================================
INSERT INTO company_modules (company_id, module_id, is_active, approved_by, approved_at)
SELECT
    c.id, m.id, TRUE,
    (SELECT id FROM users WHERE email = 'admin@pymeflowec.com'),
    NOW()
FROM companies c
CROSS JOIN modules m
WHERE c.ruc = '1790012345001'
  AND m.code IN (
      'MOD_INVOICING','MOD_INVENTORY','MOD_PRODUCTS',
      'MOD_SUPPLIERS','MOD_TAX','MOD_FINANCE','MOD_PAYMENTS'
  );

-- =============================================
-- 8. TASA DE IVA VIGENTE (15% Ecuador 2024)
-- =============================================
INSERT INTO tax_rates (company_id, tax_name, percentage, is_active, valid_from) VALUES
    ((SELECT id FROM companies WHERE ruc = '1790012345001'),
     'IVA 15%', 15.00, TRUE, '2024-04-01');

-- =============================================
-- 9. PROVEEDOR DEMO
-- =============================================
INSERT INTO suppliers (company_id, name, ruc, phone, email) VALUES
    ((SELECT id FROM companies WHERE ruc = '1790012345001'),
     'Distribuidora Nacional S.A.', '1791234567001',
     '0991234567', 'ventas@distnacional.com');

-- =============================================
-- 10. PRODUCTOS DEMO
-- =============================================
DO $$
DECLARE
    v_company_id  BIGINT;
    v_supplier_id BIGINT;
    v_tax_rate_id BIGINT;
BEGIN
    SELECT id INTO v_company_id  FROM erp.companies WHERE ruc = '1790012345001';
    SELECT id INTO v_supplier_id FROM erp.suppliers WHERE company_id = v_company_id AND ruc = '1791234567001';
    SELECT id INTO v_tax_rate_id FROM erp.tax_rates WHERE company_id = v_company_id AND is_active = TRUE LIMIT 1;

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
-- 12. CATEGORÍAS DE EGRESOS
-- =============================================
INSERT INTO expense_categories (company_id, name, category_type, description)
SELECT c.id, cat.name, cat.category_type, cat.description
FROM companies c
CROSS JOIN (VALUES
    ('Arriendo local',              'ADMINISTRATIVO',   'Pago mensual de arriendo del local comercial'),
    ('Servicios básicos',           'ADMINISTRATIVO',   'Luz, agua, internet, teléfono'),
    ('Compra de mercadería',        'INVENTARIO',       'Adquisición de productos para la venta'),
    ('Gastos de bodega',            'INVENTARIO',       'Embalajes, estanterías, materiales de almacenaje'),
    ('Transporte / flete',          'OPERATIVO',        'Fletes, mensajería y transporte de mercadería'),
    ('Mantenimiento equipo',        'OPERATIVO',        'Reparaciones y mantenimiento preventivo de equipos'),
    ('Publicidad',                  'VENTAS',           'Redes sociales, volantes, anuncios locales'),
    ('Comisiones de venta',         'VENTAS',           'Comisiones pagadas a vendedores externos'),
    ('Sueldos y salarios',          'RECURSOS_HUMANOS', 'Nómina mensual de empleados'),
    ('IESS patronal',               'RECURSOS_HUMANOS', 'Aportación patronal mensual al IESS'),
    ('Décimo tercer sueldo',        'RECURSOS_HUMANOS', 'Provisión y pago del décimo tercero'),
    ('Décimo cuarto sueldo',        'RECURSOS_HUMANOS', 'Provisión y pago del décimo cuarto'),
    ('IVA por pagar',               'TRIBUTARIO',       'Declaración y pago mensual de IVA al SRI'),
    ('Impuesto a la Renta',         'TRIBUTARIO',       'Pago anual o anticipo de impuesto a la renta'),
    ('Permiso de funcionamiento',   'TRIBUTARIO',       'Tasa municipal y permisos anuales'),
    ('Honorarios contador',         'TRIBUTARIO',       'Pago mensual al contador externo'),
    ('Comisiones bancarias',        'FINANCIERO',       'Cargos del banco por mantenimiento y transferencias'),
    ('Intereses bancarios',         'FINANCIERO',       'Intereses de créditos o sobregiros'),
    ('Multas y sanciones',          'IMPREVISTO',       'Multas SRI, municipio u otras entidades'),
    ('Reparaciones emergentes',     'IMPREVISTO',       'Arreglos urgentes no planificados')
) AS cat(name, category_type, description)
WHERE c.ruc = '1790012345001';

-- =============================================
-- 13. EGRESOS DEMO + PAGOS
-- =============================================
DO $$
DECLARE
    v_company_id    BIGINT;
    v_supplier_id   BIGINT;
    v_admin_user    BIGINT;
    v_cat_arriendo  BIGINT;
    v_cat_mercad    BIGINT;
    v_cat_iess      BIGINT;
    v_exp1_id       BIGINT;
    v_exp2_id       BIGINT;
    v_exp3_id       BIGINT;
BEGIN
    SELECT id INTO v_company_id  FROM erp.companies WHERE ruc = '1790012345001';
    SELECT id INTO v_supplier_id FROM erp.suppliers WHERE company_id = v_company_id AND ruc = '1791234567001';
    SELECT id INTO v_admin_user  FROM erp.users     WHERE email = 'jose@donpepe.com';

    SELECT id INTO v_cat_arriendo FROM erp.expense_categories
        WHERE company_id = v_company_id AND name = 'Arriendo local';
    SELECT id INTO v_cat_mercad   FROM erp.expense_categories
        WHERE company_id = v_company_id AND name = 'Compra de mercadería';
    SELECT id INTO v_cat_iess     FROM erp.expense_categories
        WHERE company_id = v_company_id AND name = 'IESS patronal';

    -- Egreso 1: Arriendo — pago único en efectivo
    INSERT INTO erp.expenses (
        company_id, category_id, supplier_name_free, description,
        expense_date, amount, voucher_number, voucher_type, payment_status, created_by
    ) VALUES (
        v_company_id, v_cat_arriendo, 'Arrendador Sr. Morales',
        'Arriendo local comercial — mayo 2025',
        '2025-05-01', 450.00, 'RC-001', 'RECIBO', 'PAGADO', v_admin_user
    ) RETURNING id INTO v_exp1_id;

    INSERT INTO erp.expense_payments (
        expense_id, company_id, payment_date, amount,
        payment_method, status, created_by
    ) VALUES (
        v_exp1_id, v_company_id, '2025-05-01',
        450.00, 'EFECTIVO', 'PAGADO', v_admin_user
    );

    -- Egreso 2: Compra mercadería — 2 cuotas por transferencia (PARCIAL)
    INSERT INTO erp.expenses (
        company_id, category_id, supplier_id, description,
        expense_date, amount, voucher_number, voucher_type, payment_status, created_by
    ) VALUES (
        v_company_id, v_cat_mercad, v_supplier_id,
        'Compra de productos — Distribuidora Nacional, mayo 2025',
        '2025-05-03', 800.00, 'FAC-1234', 'FACTURA', 'PARCIAL', v_admin_user
    ) RETURNING id INTO v_exp2_id;

    -- Cuota 1/2 — pagada
    INSERT INTO erp.expense_payments (
        expense_id, company_id, payment_date, amount, payment_method,
        transfer_reference, installment_number, installment_total, due_date, status, created_by
    ) VALUES (
        v_exp2_id, v_company_id, '2025-05-03', 400.00, 'TRANSFERENCIA',
        'TRF-20250503-001', 1, 2, '2025-05-03', 'PAGADO', v_admin_user
    );

    -- Cuota 2/2 — pendiente (vence 03-Jun)
    INSERT INTO erp.expense_payments (
        expense_id, company_id, payment_date, amount, payment_method,
        transfer_reference, installment_number, installment_total, due_date, status, created_by
    ) VALUES (
        v_exp2_id, v_company_id, CURRENT_DATE, 400.00, 'TRANSFERENCIA',
        NULL, 2, 2, '2025-06-03', 'PENDIENTE', v_admin_user
    );

    -- Egreso 3: IESS — pago único con tarjeta débito
    INSERT INTO erp.expenses (
        company_id, category_id, supplier_name_free, description,
        expense_date, amount, voucher_number, voucher_type, payment_status, created_by
    ) VALUES (
        v_company_id, v_cat_iess, 'IESS Ecuador',
        'Aportación patronal — mayo 2025',
        '2025-05-15', 185.00, 'IESS-20250515', 'LIQUIDACION', 'PAGADO', v_admin_user
    ) RETURNING id INTO v_exp3_id;

    INSERT INTO erp.expense_payments (
        expense_id, company_id, payment_date, amount, payment_method,
        card_contrapartida, status, created_by
    ) VALUES (
        v_exp3_id, v_company_id, '2025-05-15', 185.00, 'TARJETA_DEBITO',
        'CP-887654', 'PAGADO', v_admin_user
    );
END $$;

-- =============================================
-- 14. PRESUPUESTOS DE EGRESOS
-- =============================================
DO $$
DECLARE
    v_company_id BIGINT;
    v_admin_user BIGINT;
BEGIN
    SELECT id INTO v_company_id FROM erp.companies WHERE ruc = '1790012345001';
    SELECT id INTO v_admin_user FROM erp.users     WHERE email = 'jose@donpepe.com';

    -- Presupuestos MENSUALES — mayo 2025
    INSERT INTO erp.expense_budgets
        (company_id, category_id, period_type, period_year, period_month, budgeted_amount, notes, created_by)
    SELECT v_company_id, ec.id, 'MONTHLY', 2025, 5, cat.budget, cat.notes, v_admin_user
    FROM erp.expense_categories ec
    JOIN (VALUES
        ('Arriendo local',      450.00, 'Valor fijo mensual del contrato'),
        ('Servicios básicos',    80.00, 'Luz + agua + internet estimado'),
        ('Compra de mercadería',900.00, 'Presupuesto de reposición mensual'),
        ('Transporte / flete',   60.00, 'Fletes promedio mensual'),
        ('Sueldos y salarios',  800.00, 'Nómina: 2 empleados'),
        ('IESS patronal',       185.00, 'Aportación patronal estimada'),
        ('Publicidad',           50.00, 'Redes sociales y material impreso'),
        ('Honorarios contador', 120.00, 'Honorario mensual contador externo'),
        ('Comisiones bancarias', 15.00, 'Mantenimiento cuenta + transferencias'),
        ('Mantenimiento equipo', 40.00, 'Fondo preventivo mensual')
    ) AS cat(name, budget, notes) ON ec.name = cat.name AND ec.company_id = v_company_id;

    -- Presupuestos ANUALES — 2025
    INSERT INTO erp.expense_budgets
        (company_id, category_id, period_type, period_year, period_month, budgeted_amount, notes, created_by)
    SELECT v_company_id, ec.id, 'ANNUAL', 2025, NULL, cat.budget, cat.notes, v_admin_user
    FROM erp.expense_categories ec
    JOIN (VALUES
        ('Impuesto a la Renta',       600.00, 'Estimado anual IR — verificar con contador'),
        ('Permiso de funcionamiento', 150.00, 'Tasa municipal anual'),
        ('Décimo tercer sueldo',      800.00, 'Provisión décimo tercero 2 empleados'),
        ('Décimo cuarto sueldo',      800.00, 'Provisión décimo cuarto 2 empleados')
    ) AS cat(name, budget, notes) ON ec.name = cat.name AND ec.company_id = v_company_id;
END $$;

-- =============================================
-- 15. EGRESOS RECURRENTES
-- =============================================
DO $$
DECLARE
    v_company_id  BIGINT;
    v_supplier_id BIGINT;
    v_admin_user  BIGINT;
BEGIN
    SELECT id INTO v_company_id  FROM erp.companies WHERE ruc = '1790012345001';
    SELECT id INTO v_supplier_id FROM erp.suppliers WHERE company_id = v_company_id AND ruc = '1791234567001';
    SELECT id INTO v_admin_user  FROM erp.users     WHERE email = 'jose@donpepe.com';

    INSERT INTO erp.expense_recurring (
        company_id, category_id, supplier_name_free, description,
        amount, day_of_month, voucher_type, default_payment_method,
        starts_at, created_by
    )
    SELECT
        v_company_id, ec.id, rec.supplier_free, rec.description,
        rec.amount, rec.day_of_month,
        rec.voucher_type::VARCHAR(30), rec.payment_method::VARCHAR(20),
        '2025-05-01'::DATE, v_admin_user
    FROM erp.expense_categories ec
    JOIN (VALUES
        ('Arriendo local',       'Arrendador Sr. Morales',  'Arriendo mensual local comercial',     450.00,  1, 'RECIBO',          'EFECTIVO'),
        ('Servicios básicos',    'EERQ / EMAAP / CNT',      'Pago servicios básicos del local',      80.00,  5, 'FACTURA',         'TRANSFERENCIA'),
        ('Sueldos y salarios',   'Empleados Don Pepe',      'Pago nómina mensual',                  800.00, 28, 'LIQUIDACION',     'TRANSFERENCIA'),
        ('IESS patronal',        'IESS Ecuador',            'Aportación patronal mensual al IESS',  185.00, 15, 'LIQUIDACION',     'TRANSFERENCIA'),
        ('Honorarios contador',  'Contadora Sra. Vásquez',  'Honorario mensual servicio contable',  120.00,  5, 'FACTURA',         'TRANSFERENCIA'),
        ('Comisiones bancarias', 'Banco Pichincha',         'Mantenimiento cuenta corriente',        15.00,  1, 'SIN_COMPROBANTE', 'EFECTIVO')
    ) AS rec(category_name, supplier_free, description, amount, day_of_month, voucher_type, payment_method)
        ON ec.name = rec.category_name AND ec.company_id = v_company_id;
END $$;

-- =============================================
-- 16. CAJA CHICA
-- =============================================
DO $$
DECLARE
    v_company_id BIGINT;
    v_admin_user BIGINT;
    v_seller_id  BIGINT;
    v_pc_id      BIGINT;
    v_cat_op_id  BIGINT;
    v_cat_adm_id BIGINT;
BEGIN
    SELECT id INTO v_company_id FROM erp.companies WHERE ruc = '1790012345001';
    SELECT id INTO v_admin_user FROM erp.users     WHERE email = 'jose@donpepe.com';
    SELECT id INTO v_seller_id  FROM erp.users     WHERE email = 'maria@donpepe.com';
    SELECT id INTO v_cat_op_id  FROM erp.expense_categories
        WHERE company_id = v_company_id AND name = 'Transporte / flete';
    SELECT id INTO v_cat_adm_id FROM erp.expense_categories
        WHERE company_id = v_company_id AND name = 'Servicios básicos';

    -- Apertura $50
    INSERT INTO erp.petty_cash (
        company_id, name, opening_amount, current_balance,
        status, opened_by, opened_at
    ) VALUES (
        v_company_id, 'Caja Chica Don Pepe',
        50.00, 50.00, 'OPEN', v_admin_user, '2025-05-01 08:00:00-05'
    ) RETURNING id INTO v_pc_id;

    -- Gasto 1: fundas plásticas $3.50
    INSERT INTO erp.petty_cash_movements (
        petty_cash_id, company_id, movement_type, category_id,
        amount, description, voucher_number, balance_after, created_by, created_at
    ) VALUES (
        v_pc_id, v_company_id, 'EXPENSE', v_cat_op_id,
        3.50, 'Compra fundas plásticas para empaque',
        'NV-0012', 46.50, v_seller_id, '2025-05-02 10:15:00-05'
    );
    UPDATE erp.petty_cash SET current_balance = 46.50 WHERE id = v_pc_id;

    -- Gasto 2: café y refrigerios $8.00
    INSERT INTO erp.petty_cash_movements (
        petty_cash_id, company_id, movement_type, category_id,
        amount, description, voucher_number, balance_after, created_by, created_at
    ) VALUES (
        v_pc_id, v_company_id, 'EXPENSE', v_cat_adm_id,
        8.00, 'Café y refrigerios empleados — reunión',
        NULL, 38.50, v_seller_id, '2025-05-05 14:30:00-05'
    );
    UPDATE erp.petty_cash SET current_balance = 38.50 WHERE id = v_pc_id;

    -- Reposición $11.50 → vuelve a $50
    INSERT INTO erp.petty_cash_movements (
        petty_cash_id, company_id, movement_type, category_id,
        amount, description, voucher_number, balance_after, created_by, created_at
    ) VALUES (
        v_pc_id, v_company_id, 'REPLENISH', NULL,
        11.50, 'Reposición de fondo — gastos semana 1 mayo',
        NULL, 50.00, v_admin_user, '2025-05-06 09:00:00-05'
    );
    UPDATE erp.petty_cash SET current_balance = 50.00 WHERE id = v_pc_id;
END $$;

-- =============================================
-- CREDENCIALES DEMO
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
--
-- RESUMEN DE DATOS DEMO:
--   · 5 roles, 9 módulos, 2 usuarios plataforma
--   · 1 empresa (Tienda Don Pepe, RUC 1790012345001)
--   · 3 usuarios de tienda + Consumidor Final + 1 cliente
--   · 1 proveedor, 8 productos, IVA 15%
--   · 7 módulos activos para la empresa demo
--   · 20 categorías de egresos
--   · 3 egresos demo con pagos (efectivo, cuotas, tarjeta)
--   · 14 presupuestos (10 mensuales + 4 anuales)
--   · 6 egresos recurrentes para el cron
--   · 1 sesión de caja chica OPEN con 3 movimientos
-- =============================================
