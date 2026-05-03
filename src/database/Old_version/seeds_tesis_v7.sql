-- =============================================
-- PYMEFLOWEC · SEEDS v7
-- Presupuestos, recurrentes y caja chica
-- Ejecutar DESPUÉS de schema_tesis_v7.sql
-- =============================================

SET search_path TO erp;

-- =============================================
-- 1. PRESUPUESTOS DE EGRESOS — Tienda Don Pepe
-- Presupuestos mensuales para mayo 2025
-- y presupuesto anual 2025 para categorías clave
-- =============================================
DO $$
DECLARE
    v_company_id  BIGINT;
    v_admin_user  BIGINT;
BEGIN
    SELECT id INTO v_company_id FROM erp.companies WHERE ruc = '1790012345001';
    SELECT id INTO v_admin_user FROM erp.users     WHERE email = 'jose@donpepe.com';

    -- Presupuestos MENSUALES — mayo 2025
    INSERT INTO erp.expense_budgets
        (company_id, category_id, period_type, period_year, period_month, budgeted_amount, notes, created_by)
    SELECT
        v_company_id,
        ec.id,
        'MONTHLY',
        2025,
        5,
        cat.budget,
        cat.notes,
        v_admin_user
    FROM erp.expense_categories ec
    JOIN (VALUES
        ('Arriendo local',              450.00,  'Valor fijo mensual del contrato'),
        ('Servicios básicos',            80.00,  'Luz + agua + internet estimado'),
        ('Compra de mercadería',        900.00,  'Presupuesto de reposición mensual'),
        ('Transporte / flete',           60.00,  'Fletes promedio mensual'),
        ('Sueldos y salarios',          800.00,  'Nómina: 2 empleados'),
        ('IESS patronal',               185.00,  'Aportación patronal estimada'),
        ('Publicidad',                   50.00,  'Redes sociales y material impreso'),
        ('Honorarios contador',         120.00,  'Honorario mensual contador externo'),
        ('Comisiones bancarias',         15.00,  'Mantenimiento cuenta + transferencias'),
        ('Mantenimiento equipo',         40.00,  'Fondo preventivo mensual')
    ) AS cat(name, budget, notes)
        ON ec.name = cat.name AND ec.company_id = v_company_id;

    -- Presupuestos ANUALES — 2025 para categorías tributarias
    INSERT INTO erp.expense_budgets
        (company_id, category_id, period_type, period_year, period_month, budgeted_amount, notes, created_by)
    SELECT
        v_company_id,
        ec.id,
        'ANNUAL',
        2025,
        NULL,
        cat.budget,
        cat.notes,
        v_admin_user
    FROM erp.expense_categories ec
    JOIN (VALUES
        ('Impuesto a la Renta',         600.00, 'Estimado anual IR — verificar con contador'),
        ('Permiso de funcionamiento',   150.00, 'Tasa municipal anual'),
        ('Décimo tercer sueldo',        800.00, 'Provisión décimo tercero 2 empleados'),
        ('Décimo cuarto sueldo',        800.00, 'Provisión décimo cuarto 2 empleados')
    ) AS cat(name, budget, notes)
        ON ec.name = cat.name AND ec.company_id = v_company_id;

END $$;

-- =============================================
-- 2. EGRESOS RECURRENTES — Tienda Don Pepe
-- Plantillas que el cron genera mensualmente
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
        company_id, category_id,
        supplier_name_free, description,
        amount, day_of_month,
        voucher_type, default_payment_method,
        starts_at, created_by
    )
    SELECT
        v_company_id,
        ec.id,
        rec.supplier_free,
        rec.description,
        rec.amount,
        rec.day_of_month,
        rec.voucher_type::VARCHAR(30),
        rec.payment_method::VARCHAR(20),
        '2025-05-01'::DATE,
        v_admin_user
    FROM erp.expense_categories ec
    JOIN (VALUES
        ('Arriendo local',       'Arrendador Sr. Morales',   'Arriendo mensual local comercial',      450.00,  1,  'RECIBO',           'EFECTIVO'),
        ('Servicios básicos',    'EERQ / EMAAP / CNT',       'Pago servicios básicos del local',       80.00,  5,  'FACTURA',          'TRANSFERENCIA'),
        ('Sueldos y salarios',   'Empleados Don Pepe',       'Pago nómina mensual',                   800.00, 28,  'LIQUIDACION',      'TRANSFERENCIA'),
        ('IESS patronal',        'IESS Ecuador',             'Aportación patronal mensual al IESS',   185.00, 15,  'LIQUIDACION',      'TRANSFERENCIA'),
        ('Honorarios contador',  'Contadora Sra. Vásquez',   'Honorario mensual servicio contable',   120.00,  5,  'FACTURA',          'TRANSFERENCIA'),
        ('Comisiones bancarias', 'Banco Pichincha',          'Mantenimiento cuenta corriente',         15.00,  1,  'SIN_COMPROBANTE',  'EFECTIVO')
    ) AS rec(category_name, supplier_free, description, amount, day_of_month, voucher_type, payment_method)
        ON ec.name = rec.category_name AND ec.company_id = v_company_id;

END $$;

-- =============================================
-- 3. CAJA CHICA — apertura demo
-- Fondo inicial de $50, con 3 movimientos:
--   · Gasto: compra de fundas plásticas
--   · Gasto: café y refrigerios empleados
--   · Reposición del fondo
-- =============================================
DO $$
DECLARE
    v_company_id  BIGINT;
    v_admin_user  BIGINT;
    v_seller_id   BIGINT;
    v_pc_id       BIGINT;
    v_cat_op_id   BIGINT;  -- OPERATIVO (gastos menores)
    v_cat_adm_id  BIGINT;  -- ADMINISTRATIVO
BEGIN
    SELECT id INTO v_company_id FROM erp.companies WHERE ruc = '1790012345001';
    SELECT id INTO v_admin_user FROM erp.users     WHERE email = 'jose@donpepe.com';
    SELECT id INTO v_seller_id  FROM erp.users     WHERE email = 'maria@donpepe.com';

    SELECT id INTO v_cat_op_id
        FROM erp.expense_categories
        WHERE company_id = v_company_id AND name = 'Transporte / flete';

    SELECT id INTO v_cat_adm_id
        FROM erp.expense_categories
        WHERE company_id = v_company_id AND name = 'Servicios básicos';

    -- Apertura de caja chica con $50
    INSERT INTO erp.petty_cash (
        company_id, name,
        opening_amount, current_balance,
        status, opened_by, opened_at
    ) VALUES (
        v_company_id, 'Caja Chica Don Pepe',
        50.00, 50.00,
        'OPEN', v_admin_user, '2025-05-01 08:00:00-05'
    ) RETURNING id INTO v_pc_id;

    -- Movimiento 1: gasto fundas plásticas ($3.50)
    INSERT INTO erp.petty_cash_movements (
        petty_cash_id, company_id,
        movement_type, category_id,
        amount, description,
        voucher_number, balance_after,
        created_by, created_at
    ) VALUES (
        v_pc_id, v_company_id,
        'EXPENSE', v_cat_op_id,
        3.50, 'Compra fundas plásticas para empaque',
        'NV-0012', 46.50,
        v_seller_id, '2025-05-02 10:15:00-05'
    );

    -- Actualizar saldo en caja chica
    UPDATE erp.petty_cash SET current_balance = 46.50 WHERE id = v_pc_id;

    -- Movimiento 2: gasto café y refrigerios ($8.00)
    INSERT INTO erp.petty_cash_movements (
        petty_cash_id, company_id,
        movement_type, category_id,
        amount, description,
        voucher_number, balance_after,
        created_by, created_at
    ) VALUES (
        v_pc_id, v_company_id,
        'EXPENSE', v_cat_adm_id,
        8.00, 'Café y refrigerios para empleados — reunión',
        NULL, 38.50,
        v_seller_id, '2025-05-05 14:30:00-05'
    );

    UPDATE erp.petty_cash SET current_balance = 38.50 WHERE id = v_pc_id;

    -- Movimiento 3: reposición del fondo ($11.50 → vuelve a $50)
    INSERT INTO erp.petty_cash_movements (
        petty_cash_id, company_id,
        movement_type, category_id,
        amount, description,
        voucher_number, balance_after,
        created_by, created_at
    ) VALUES (
        v_pc_id, v_company_id,
        'REPLENISH', NULL,
        11.50, 'Reposición de fondo — gastos semana 1 mayo',
        NULL, 50.00,
        v_admin_user, '2025-05-06 09:00:00-05'
    );

    UPDATE erp.petty_cash SET current_balance = 50.00 WHERE id = v_pc_id;

END $$;

-- =============================================
-- RESUMEN SEEDS v7
-- =============================================
-- 1. expense_budgets
--    · 10 presupuestos mensuales (mayo 2025)
--    · 4 presupuestos anuales (2025)
--
-- 2. expense_recurring (6 plantillas activas)
--    · Arriendo         → día 1,  efectivo
--    · Servicios básicos→ día 5,  transferencia
--    · Sueldos          → día 28, transferencia
--    · IESS patronal    → día 15, transferencia
--    · Contador         → día 5,  transferencia
--    · Comisiones banco → día 1,  efectivo
--
-- 3. petty_cash (1 sesión OPEN)
--    · Apertura: $50.00
--    · Gasto 1:  -$3.50  (fundas plásticas)
--    · Gasto 2:  -$8.00  (café empleados)
--    · Reposición: +$11.50
--    · Saldo actual: $50.00
-- =============================================
