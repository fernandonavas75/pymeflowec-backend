-- =============================================
-- PYMEFLOWEC · SEEDS v6
-- MOD_FINANCE + MOD_PAYMENTS
-- Ejecutar DESPUÉS de schema_tesis_v6.sql
-- =============================================

SET search_path TO erp;

-- =============================================
-- 1. NUEVOS MÓDULOS ACTIVADOS PARA LA DEMO
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
  AND m.code IN ('MOD_FINANCE', 'MOD_PAYMENTS');

-- =============================================
-- 2. CATEGORÍAS DE EGRESOS — Tienda Don Pepe
-- 18 categorías distribuidas en los 8 tipos
-- =============================================
INSERT INTO expense_categories (company_id, name, category_type, description)
SELECT c.id, cat.name, cat.category_type, cat.description
FROM companies c
CROSS JOIN (VALUES
    -- ADMINISTRATIVO
    ('Arriendo local',              'ADMINISTRATIVO',   'Pago mensual de arriendo del local comercial'),
    ('Servicios básicos',           'ADMINISTRATIVO',   'Luz, agua, internet, teléfono'),
    -- INVENTARIO
    ('Compra de mercadería',        'INVENTARIO',       'Adquisición de productos para la venta'),
    ('Gastos de bodega',            'INVENTARIO',       'Embalajes, estanterías, materiales de almacenaje'),
    -- OPERATIVO
    ('Transporte / flete',          'OPERATIVO',        'Fletes, mensajería y transporte de mercadería'),
    ('Mantenimiento equipo',        'OPERATIVO',        'Reparaciones y mantenimiento preventivo de equipos'),
    -- VENTAS
    ('Publicidad',                  'VENTAS',           'Redes sociales, volantes, anuncios locales'),
    ('Comisiones de venta',         'VENTAS',           'Comisiones pagadas a vendedores externos'),
    -- RECURSOS HUMANOS
    ('Sueldos y salarios',          'RECURSOS_HUMANOS', 'Nómina mensual de empleados'),
    ('IESS patronal',               'RECURSOS_HUMANOS', 'Aportación patronal mensual al IESS'),
    ('Décimo tercer sueldo',        'RECURSOS_HUMANOS', 'Provisión y pago del décimo tercero'),
    ('Décimo cuarto sueldo',        'RECURSOS_HUMANOS', 'Provisión y pago del décimo cuarto'),
    -- TRIBUTARIO
    ('IVA por pagar',               'TRIBUTARIO',       'Declaración y pago mensual de IVA al SRI'),
    ('Impuesto a la Renta',         'TRIBUTARIO',       'Pago anual o anticipo de impuesto a la renta'),
    ('Permiso de funcionamiento',   'TRIBUTARIO',       'Tasa municipal y permisos anuales'),
    ('Honorarios contador',         'TRIBUTARIO',       'Pago mensual al contador externo'),
    -- FINANCIERO
    ('Comisiones bancarias',        'FINANCIERO',       'Cargos del banco por mantenimiento y transferencias'),
    ('Intereses bancarios',         'FINANCIERO',       'Intereses de créditos o sobregiros'),
    -- IMPREVISTO
    ('Multas y sanciones',          'IMPREVISTO',       'Multas SRI, municipio u otras entidades'),
    ('Reparaciones emergentes',     'IMPREVISTO',       'Arreglos urgentes no planificados')
) AS cat(name, category_type, description)
WHERE c.ruc = '1790012345001';

-- =============================================
-- 3. EGRESOS DE DEMO
-- 3 egresos que ilustran los casos de uso:
--   a) Pago único en efectivo
--   b) Pago en 2 cuotas por transferencia
--   c) Pago único con tarjeta de débito
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

    -- --------------------------------------------------
    -- Egreso 1: Arriendo mayo — pago único en efectivo
    -- --------------------------------------------------
    INSERT INTO erp.expenses (
        company_id, category_id,
        supplier_name_free, description,
        expense_date, amount,
        voucher_number, voucher_type,
        payment_status, created_by
    ) VALUES (
        v_company_id, v_cat_arriendo,
        'Arrendador Sr. Morales', 'Arriendo local comercial — mayo 2025',
        '2025-05-01', 450.00,
        'RC-001', 'RECIBO',
        'PAGADO', v_admin_user
    ) RETURNING id INTO v_exp1_id;

    INSERT INTO erp.expense_payments (
        expense_id, company_id,
        payment_date, amount, payment_method,
        status, created_by
    ) VALUES (
        v_exp1_id, v_company_id,
        '2025-05-01', 450.00, 'EFECTIVO',
        'PAGADO', v_admin_user
    );

    -- --------------------------------------------------
    -- Egreso 2: Compra mercadería — 2 cuotas, transferencia
    --   Cuota 1 ya pagada, cuota 2 pendiente (vence 03-Jun)
    -- --------------------------------------------------
    INSERT INTO erp.expenses (
        company_id, category_id,
        supplier_id, description,
        expense_date, amount,
        voucher_number, voucher_type,
        payment_status, created_by
    ) VALUES (
        v_company_id, v_cat_mercad,
        v_supplier_id, 'Compra de productos — Distribuidora Nacional, mayo 2025',
        '2025-05-03', 800.00,
        'FAC-1234', 'FACTURA',
        'PARCIAL', v_admin_user
    ) RETURNING id INTO v_exp2_id;

    -- Cuota 1/2 — pagada
    INSERT INTO erp.expense_payments (
        expense_id, company_id,
        payment_date, amount, payment_method,
        transfer_reference,
        installment_number, installment_total, due_date,
        status, created_by
    ) VALUES (
        v_exp2_id, v_company_id,
        '2025-05-03', 400.00, 'TRANSFERENCIA',
        'TRF-20250503-001',
        1, 2, '2025-05-03',
        'PAGADO', v_admin_user
    );

    -- Cuota 2/2 — pendiente de pago
    INSERT INTO erp.expense_payments (
        expense_id, company_id,
        payment_date, amount, payment_method,
        transfer_reference,
        installment_number, installment_total, due_date,
        status, created_by
    ) VALUES (
        v_exp2_id, v_company_id,
        CURRENT_DATE, 400.00, 'TRANSFERENCIA',
        NULL,
        2, 2, '2025-06-03',
        'PENDIENTE', v_admin_user
    );

    -- --------------------------------------------------
    -- Egreso 3: IESS patronal — pago único con tarjeta débito
    -- --------------------------------------------------
    INSERT INTO erp.expenses (
        company_id, category_id,
        supplier_name_free, description,
        expense_date, amount,
        voucher_number, voucher_type,
        payment_status, created_by
    ) VALUES (
        v_company_id, v_cat_iess,
        'IESS Ecuador', 'Aportación patronal — mayo 2025',
        '2025-05-15', 185.00,
        'IESS-20250515', 'LIQUIDACION',
        'PAGADO', v_admin_user
    ) RETURNING id INTO v_exp3_id;

    INSERT INTO erp.expense_payments (
        expense_id, company_id,
        payment_date, amount, payment_method,
        card_contrapartida,
        status, created_by
    ) VALUES (
        v_exp3_id, v_company_id,
        '2025-05-15', 185.00, 'TARJETA_DEBITO',
        'CP-887654',
        'PAGADO', v_admin_user
    );

END $$;

-- =============================================
-- 4. PAGOS DE FACTURA DE DEMO (invoice_payments)
-- Se agrega un cobro de ejemplo a la primera
-- factura existente de la empresa demo.
-- Ilustra pago mixto: efectivo + transferencia.
-- =============================================
DO $$
DECLARE
    v_company_id BIGINT;
    v_invoice_id BIGINT;
    v_seller_id  BIGINT;
BEGIN
    SELECT id INTO v_company_id FROM erp.companies WHERE ruc = '1790012345001';
    SELECT id INTO v_seller_id  FROM erp.users     WHERE email = 'maria@donpepe.com';

    -- Tomar la primera factura emitida de la empresa demo
    SELECT id INTO v_invoice_id
        FROM erp.invoices
        WHERE company_id = v_company_id
        ORDER BY created_at ASC
        LIMIT 1;

    -- Si existe factura, agregar cobro demo
    IF v_invoice_id IS NOT NULL THEN

        -- Pago parcial en efectivo
        INSERT INTO erp.invoice_payments (
            invoice_id, company_id,
            payment_date, amount, payment_method,
            installment_number, installment_total, due_date,
            status, notes, created_by
        ) VALUES (
            v_invoice_id, v_company_id,
            CURRENT_DATE, 5.00, 'EFECTIVO',
            1, 2, CURRENT_DATE,
            'COBRADO', 'Abono inicial en efectivo', v_seller_id
        );

        -- Segunda cuota pendiente (transferencia, vence en 15 días)
        INSERT INTO erp.invoice_payments (
            invoice_id, company_id,
            payment_date, amount, payment_method,
            transfer_reference,
            installment_number, installment_total, due_date,
            status, notes, created_by
        ) VALUES (
            v_invoice_id, v_company_id,
            CURRENT_DATE, 5.00, 'TRANSFERENCIA',
            NULL,
            2, 2, CURRENT_DATE + INTERVAL '15 days',
            'PENDIENTE', 'Saldo restante por transferencia', v_seller_id
        );

        -- Actualizar payment_status de la factura a PARCIAL
        UPDATE erp.invoices
           SET payment_status = 'PARCIAL'
         WHERE id = v_invoice_id AND company_id = v_company_id;

    END IF;
END $$;

-- =============================================
-- RESUMEN SEEDS v6
-- =============================================
-- 1. company_modules     → MOD_FINANCE + MOD_PAYMENTS activados para Don Pepe
-- 2. expense_categories  → 20 categorías (8 tipos) para la empresa demo
-- 3. expenses            → 3 egresos demo:
--      · Arriendo (efectivo, PAGADO)
--      · Mercadería (2 cuotas transferencia, PARCIAL)
--      · IESS (tarjeta débito + contrapartida, PAGADO)
-- 4. invoice_payments    → cobro demo en 2 cuotas sobre la 1ra factura:
--      · Cuota 1: $5.00 efectivo, COBRADO
--      · Cuota 2: $5.00 transferencia, PENDIENTE (vence en 15 días)
-- =============================================
