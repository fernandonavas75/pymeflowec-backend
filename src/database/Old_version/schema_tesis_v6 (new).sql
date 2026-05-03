-- =============================================
-- PYMEFLOWEC · SCHEMA v6
-- Nuevos módulos:
--   MOD_FINANCE  → Egresos operacionales
--   MOD_PAYMENTS → Pagos de facturas (contado + cuotas)
-- Ejecutar DESPUÉS de schema_tesis_v5.sql
-- =============================================

SET search_path TO erp;

-- =============================================
-- 1. EXPENSE CATEGORIES
-- Catálogo de categorías de egresos por tenant.
-- Cada empresa puede personalizar sus categorías.
-- =============================================
CREATE TABLE expense_categories (
    id              BIGSERIAL PRIMARY KEY,
    company_id      BIGINT       NOT NULL,
    name            VARCHAR(100) NOT NULL,
    category_type   VARCHAR(30)  NOT NULL
                    CHECK (category_type IN (
                        'ADMINISTRATIVO',
                        'OPERATIVO',
                        'VENTAS',
                        'FINANCIERO',
                        'TRIBUTARIO',
                        'RECURSOS_HUMANOS',
                        'INVENTARIO',
                        'IMPREVISTO'
                    )),
    description     VARCHAR(255),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ  NULL,
    CONSTRAINT fk_ec_company    FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT uq_ec_id_company UNIQUE (id, company_id)
);

COMMENT ON TABLE  expense_categories               IS 'Catálogo de categorías de egresos por tenant.';
COMMENT ON COLUMN expense_categories.category_type IS 'Tipo macro del egreso según clasificación PymeFlowEc.';

-- =============================================
-- 2. EXPENSES (cabecera del egreso)
-- Un egreso puede pagarse en uno o varios pagos
-- registrados en expense_payments.
-- =============================================
CREATE TABLE expenses (
    id                  BIGSERIAL PRIMARY KEY,
    company_id          BIGINT        NOT NULL,
    category_id         BIGINT        NOT NULL,
    -- supplier_id apunta a la tabla suppliers cuando el proveedor ya está registrado.
    -- supplier_name_free se usa para pagos puntuales sin proveedor en BD.
    -- Al menos uno de los dos debe estar presente (ver CHECK abajo).
    supplier_id         BIGINT        NULL,
    supplier_name_free  VARCHAR(150)  NULL,
    description         TEXT          NOT NULL,
    expense_date        DATE          NOT NULL DEFAULT CURRENT_DATE,
    amount              NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    -- Comprobante de respaldo (factura recibida, recibo, nota de venta, etc.)
    voucher_number      VARCHAR(50)   NULL,
    voucher_type        VARCHAR(30)   NULL
                        CHECK (voucher_type IN (
                            'FACTURA',
                            'NOTA_VENTA',
                            'RECIBO',
                            'LIQUIDACION',
                            'SIN_COMPROBANTE',
                            'OTRO'
                        )),
    -- Estado de pago global — el backend lo recalcula al registrar/modificar expense_payments
    payment_status      VARCHAR(20)   NOT NULL DEFAULT 'PENDIENTE'
                        CHECK (payment_status IN (
                            'PENDIENTE',   -- sin ningún pago aún
                            'PARCIAL',     -- pagado parcialmente (cuotas)
                            'PAGADO',      -- monto total cubierto
                            'ANULADO'
                        )),
    notes               TEXT          NULL,
    created_by          BIGINT        NOT NULL,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ   NULL,
    CONSTRAINT fk_exp_company          FOREIGN KEY (company_id)  REFERENCES companies(id),
    CONSTRAINT fk_exp_category_company FOREIGN KEY (category_id, company_id)
                                       REFERENCES expense_categories(id, company_id),
    CONSTRAINT fk_exp_supplier_company FOREIGN KEY (supplier_id, company_id)
                                       REFERENCES suppliers(id, company_id),
    CONSTRAINT fk_exp_created_by       FOREIGN KEY (created_by)  REFERENCES users(id),
    CONSTRAINT uq_exp_id_company        UNIQUE (id, company_id),
    CONSTRAINT chk_exp_supplier_required
        CHECK (supplier_id IS NOT NULL OR supplier_name_free IS NOT NULL)
);

COMMENT ON TABLE  expenses                     IS 'Egresos operacionales del negocio. Un egreso puede pagarse en cuotas via expense_payments.';
COMMENT ON COLUMN expenses.supplier_name_free  IS 'Nombre libre del proveedor cuando no está registrado en la tabla suppliers.';
COMMENT ON COLUMN expenses.payment_status      IS 'Recalculado por el backend: suma pagos PAGADO vs monto total.';
COMMENT ON COLUMN expenses.voucher_number      IS 'Número del comprobante de respaldo (factura recibida, recibo, etc.).';

-- =============================================
-- 3. EXPENSE PAYMENTS
-- Pagos de un egreso. Soporta pago único o
-- en cuotas (N filas por egreso).
-- Misma estructura de métodos que invoice_payments.
-- =============================================
CREATE TABLE expense_payments (
    id                  BIGSERIAL PRIMARY KEY,
    expense_id          BIGINT        NOT NULL,
    company_id          BIGINT        NOT NULL,
    payment_date        DATE          NOT NULL DEFAULT CURRENT_DATE,
    amount              NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method      VARCHAR(20)   NOT NULL
                        CHECK (payment_method IN (
                            'EFECTIVO',
                            'TRANSFERENCIA',
                            'TARJETA_DEBITO',
                            'TARJETA_CREDITO',
                            'CHEQUE',
                            'OTRO'
                        )),
    -- TRANSFERENCIA → obligatorio
    transfer_reference  VARCHAR(100)  NULL,
    -- TARJETA_DEBITO / TARJETA_CREDITO → obligatorio
    card_contrapartida  VARCHAR(100)  NULL,
    -- CHEQUE → opcional
    cheque_number       VARCHAR(50)   NULL,
    -- Cuotas: ambos campos o ninguno; número <= total
    installment_number  SMALLINT      NULL CHECK (installment_number > 0),
    installment_total   SMALLINT      NULL CHECK (installment_total > 0),
    due_date            DATE          NULL,
    status              VARCHAR(20)   NOT NULL DEFAULT 'PAGADO'
                        CHECK (status IN ('PENDIENTE','PAGADO','VENCIDO','ANULADO')),
    notes               TEXT          NULL,
    created_by          BIGINT        NOT NULL,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_ep_company         FOREIGN KEY (company_id)  REFERENCES companies(id),
    CONSTRAINT fk_ep_expense_company FOREIGN KEY (expense_id, company_id)
                                     REFERENCES expenses(id, company_id)
                                     ON DELETE CASCADE,
    CONSTRAINT fk_ep_created_by      FOREIGN KEY (created_by)  REFERENCES users(id),
    -- transfer_reference obligatorio solo cuando el pago ya fue ejecutado
    CONSTRAINT chk_ep_transfer_ref
        CHECK (payment_method != 'TRANSFERENCIA'
               OR status = 'PENDIENTE'
               OR transfer_reference IS NOT NULL),
    -- card_contrapartida obligatoria solo cuando el pago ya fue ejecutado
    CONSTRAINT chk_ep_card_contrapartida
        CHECK (payment_method NOT IN ('TARJETA_DEBITO','TARJETA_CREDITO')
               OR status = 'PENDIENTE'
               OR card_contrapartida IS NOT NULL),
    CONSTRAINT chk_ep_installments
        CHECK ((installment_number IS NULL AND installment_total IS NULL)
               OR (installment_number IS NOT NULL AND installment_total IS NOT NULL
                   AND installment_number <= installment_total))
);

COMMENT ON TABLE  expense_payments                    IS 'Pagos asociados a un egreso. Soporta pago único o en cuotas.';
COMMENT ON COLUMN expense_payments.transfer_reference IS 'Número de transacción bancaria (transferencias).';
COMMENT ON COLUMN expense_payments.card_contrapartida IS 'Código de contrapartida generado por el datafono al pagar con tarjeta.';
COMMENT ON COLUMN expense_payments.installment_number IS 'Número de cuota actual (ej: 1 de 3).';
COMMENT ON COLUMN expense_payments.installment_total  IS 'Total de cuotas acordadas.';
COMMENT ON COLUMN expense_payments.due_date           IS 'Fecha límite de la cuota. NULL = pago inmediato.';

-- =============================================
-- 4. INVOICES — agregar payment_status
-- Separa estado documental (status: ISSUED/CANCELLED)
-- de estado de cobro (payment_status).
-- =============================================
ALTER TABLE invoices
    ADD COLUMN payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (payment_status IN ('PENDIENTE','PARCIAL','COBRADO','ANULADO'));

COMMENT ON COLUMN invoices.payment_status IS 'Estado de cobro de la factura. Recalculado por el backend al registrar invoice_payments.';

-- =============================================
-- 5. INVOICE PAYMENTS
-- Cobros de una factura. Soporta múltiples
-- métodos de pago y pago en cuotas.
-- =============================================
CREATE TABLE invoice_payments (
    id                  BIGSERIAL PRIMARY KEY,
    invoice_id          BIGINT        NOT NULL,
    company_id          BIGINT        NOT NULL,
    payment_date        DATE          NOT NULL DEFAULT CURRENT_DATE,
    amount              NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method      VARCHAR(20)   NOT NULL
                        CHECK (payment_method IN (
                            'EFECTIVO',
                            'TRANSFERENCIA',
                            'TARJETA_DEBITO',
                            'TARJETA_CREDITO',
                            'CHEQUE',
                            'OTRO'
                        )),
    -- TRANSFERENCIA → obligatorio
    transfer_reference  VARCHAR(100)  NULL,
    -- TARJETA_DEBITO / TARJETA_CREDITO → obligatorio
    card_contrapartida  VARCHAR(100)  NULL,
    -- CHEQUE → opcional
    cheque_number       VARCHAR(50)   NULL,
    -- Cuotas: ambos campos o ninguno; número <= total
    installment_number  SMALLINT      NULL CHECK (installment_number > 0),
    installment_total   SMALLINT      NULL CHECK (installment_total > 0),
    due_date            DATE          NULL,
    status              VARCHAR(20)   NOT NULL DEFAULT 'COBRADO'
                        CHECK (status IN ('PENDIENTE','COBRADO','VENCIDO','ANULADO')),
    notes               TEXT          NULL,
    created_by          BIGINT        NOT NULL,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_ip_company         FOREIGN KEY (company_id)  REFERENCES companies(id),
    CONSTRAINT fk_ip_invoice_company FOREIGN KEY (invoice_id, company_id)
                                     REFERENCES invoices(id, company_id)
                                     ON DELETE CASCADE,
    CONSTRAINT fk_ip_created_by      FOREIGN KEY (created_by)  REFERENCES users(id),
    -- transfer_reference obligatorio solo cuando el pago ya fue ejecutado
    CONSTRAINT chk_ip_transfer_ref
        CHECK (payment_method != 'TRANSFERENCIA'
               OR status = 'PENDIENTE'
               OR transfer_reference IS NOT NULL),
    -- card_contrapartida obligatoria solo cuando el pago ya fue ejecutado
    CONSTRAINT chk_ip_card_contrapartida
        CHECK (payment_method NOT IN ('TARJETA_DEBITO','TARJETA_CREDITO')
               OR status = 'PENDIENTE'
               OR card_contrapartida IS NOT NULL),
    CONSTRAINT chk_ip_installments
        CHECK ((installment_number IS NULL AND installment_total IS NULL)
               OR (installment_number IS NOT NULL AND installment_total IS NOT NULL
                   AND installment_number <= installment_total))
);

COMMENT ON TABLE  invoice_payments                    IS 'Cobros asociados a una factura. Soporta múltiples métodos y pago en cuotas.';
COMMENT ON COLUMN invoice_payments.transfer_reference IS 'Número de transacción bancaria (transferencias).';
COMMENT ON COLUMN invoice_payments.card_contrapartida IS 'Código de contrapartida del datafono al cobrar con tarjeta.';
COMMENT ON COLUMN invoice_payments.installment_number IS 'Número de cuota actual (ej: 2 de 3).';
COMMENT ON COLUMN invoice_payments.installment_total  IS 'Total de cuotas pactadas con el cliente.';
COMMENT ON COLUMN invoice_payments.due_date           IS 'Fecha límite de la cuota. NULL = cobro inmediato.';
COMMENT ON COLUMN invoice_payments.status             IS 'PENDIENTE = cuota futura | COBRADO = recibido | VENCIDO = pasó due_date | ANULADO.';

-- =============================================
-- 6. ÍNDICES OPERATIVOS
-- =============================================
-- expense_categories
CREATE INDEX idx_ec_company ON expense_categories(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_ec_type    ON expense_categories(company_id, category_type);

-- expenses
CREATE INDEX idx_exp_company  ON expenses(company_id)                    WHERE deleted_at IS NULL;
CREATE INDEX idx_exp_category ON expenses(category_id);
CREATE INDEX idx_exp_supplier ON expenses(supplier_id)                   WHERE supplier_id IS NOT NULL;
CREATE INDEX idx_exp_date     ON expenses(company_id, expense_date);
CREATE INDEX idx_exp_status   ON expenses(company_id, payment_status)    WHERE deleted_at IS NULL;

-- expense_payments
CREATE INDEX idx_ep_expense ON expense_payments(expense_id);
CREATE INDEX idx_ep_company ON expense_payments(company_id);
CREATE INDEX idx_ep_due     ON expense_payments(due_date)
    WHERE status = 'PENDIENTE' AND due_date IS NOT NULL;

-- invoice_payments
CREATE INDEX idx_ip_invoice ON invoice_payments(invoice_id);
CREATE INDEX idx_ip_company ON invoice_payments(company_id);
CREATE INDEX idx_ip_date    ON invoice_payments(company_id, payment_date);
CREATE INDEX idx_ip_due     ON invoice_payments(due_date)
    WHERE status = 'PENDIENTE' AND due_date IS NOT NULL;

-- =============================================
-- 7. TRIGGERS — updated_at automático
-- =============================================
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'expense_categories',
        'expenses',
        'expense_payments',
        'invoice_payments'
    ]) LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_updated_at_%s
             BEFORE UPDATE ON erp.%I
             FOR EACH ROW EXECUTE FUNCTION erp.fn_set_updated_at();',
            t, t
        );
    END LOOP;
END $$;

-- =============================================
-- 8. TRIGGERS — auditoría automática
-- =============================================
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'expense_categories',
        'expenses',
        'expense_payments',
        'invoice_payments'
    ]) LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_audit_%s
             AFTER INSERT OR UPDATE OR DELETE ON erp.%I
             FOR EACH ROW EXECUTE FUNCTION erp.fn_audit_trigger();',
            t, t
        );
    END LOOP;
END $$;

-- =============================================
-- 9. NUEVOS MÓDULOS EN EL CATÁLOGO
-- =============================================
INSERT INTO modules (code, name, description) VALUES
    ('MOD_FINANCE',
     'Módulo Financiero',
     'Registro y seguimiento de egresos operacionales: arriendos, nómina, impuestos, etc.'),
    ('MOD_PAYMENTS',
     'Pagos de Facturas',
     'Gestión de cobros de facturas: efectivo, transferencia, tarjeta y pago en cuotas.');

-- =============================================
-- RESUMEN SCHEMA v6
-- =============================================
-- NUEVAS TABLAS:
--   expense_categories  → catálogo de categorías de egresos por tenant
--   expenses            → cabecera del egreso (monto, proveedor, comprobante)
--   expense_payments    → pagos del egreso (efectivo, transferencia, tarjeta, cuotas)
--   invoice_payments    → cobros de facturas (idem)
--
-- COLUMNA AÑADIDA:
--   invoices.payment_status → PENDIENTE | PARCIAL | COBRADO | ANULADO
--
-- NUEVOS MÓDULOS:
--   MOD_FINANCE  — Módulo Financiero (egresos)
--   MOD_PAYMENTS — Pagos de Facturas
--
-- MÉTODOS DE PAGO:
--   EFECTIVO         → sin campos adicionales
--   TRANSFERENCIA    → transfer_reference obligatorio
--   TARJETA_DEBITO   → card_contrapartida obligatorio
--   TARJETA_CREDITO  → card_contrapartida obligatorio
--   CHEQUE           → cheque_number opcional
--   OTRO             → libre
--
-- CUOTAS:
--   installment_number / installment_total / due_date
--   El backend recalcula payment_status sumando pagos
--   con status PAGADO/COBRADO vs el amount de la cabecera.
-- =============================================
