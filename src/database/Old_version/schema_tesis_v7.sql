-- =============================================
-- PYMEFLOWEC · SCHEMA v7
-- Extensión del Módulo Financiero:
--   1. expense_budgets     → presupuesto por categoría/período
--   2. expense_recurring   → egresos recurrentes (cron)
--   3. petty_cash          → caja chica (apertura/movimientos/cierre)
--   4. petty_cash_movements→ movimientos de caja chica
--   5. v_cash_flow         → vista de flujo de caja
--   6. v_tax_deduction     → vista de deducibilidad tributaria
-- Ejecutar DESPUÉS de schema_tesis_v6.sql
-- =============================================

SET search_path TO erp;

-- =============================================
-- 1. EXPENSE BUDGETS
-- Presupuesto de egresos por categoría y período.
-- Permite comparar presupuestado vs ejecutado.
-- period_type: MONTHLY o ANNUAL
-- =============================================
CREATE TABLE expense_budgets (
    id              BIGSERIAL PRIMARY KEY,
    company_id      BIGINT        NOT NULL,
    category_id     BIGINT        NOT NULL,
    period_type     VARCHAR(10)   NOT NULL
                    CHECK (period_type IN ('MONTHLY','ANNUAL')),
    -- Para MONTHLY: year + month (1-12)
    -- Para ANNUAL:  year + month IS NULL
    period_year     SMALLINT      NOT NULL CHECK (period_year >= 2020),
    period_month    SMALLINT      NULL
                    CHECK (period_month IS NULL OR period_month BETWEEN 1 AND 12),
    budgeted_amount NUMERIC(12,2) NOT NULL CHECK (budgeted_amount > 0),
    notes           TEXT          NULL,
    created_by      BIGINT        NOT NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_eb_company          FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_eb_category_company FOREIGN KEY (category_id, company_id)
                                      REFERENCES expense_categories(id, company_id),
    CONSTRAINT fk_eb_created_by       FOREIGN KEY (created_by) REFERENCES users(id),
    -- Un presupuesto por categoría/período (no duplicar)
    CONSTRAINT uq_eb_category_period  UNIQUE (company_id, category_id, period_type, period_year, period_month),
    -- MONTHLY debe tener mes; ANNUAL no debe tener mes
    CONSTRAINT chk_eb_period_month
        CHECK ((period_type = 'MONTHLY' AND period_month IS NOT NULL)
            OR (period_type = 'ANNUAL'  AND period_month IS NULL))
);

COMMENT ON TABLE  expense_budgets                IS 'Presupuesto de egresos por categoría y período. El backend compara con SUM(expenses.amount) del mismo período.';
COMMENT ON COLUMN expense_budgets.period_year    IS 'Año del presupuesto (ej: 2025).';
COMMENT ON COLUMN expense_budgets.period_month   IS 'Mes 1-12 para presupuesto mensual. NULL para presupuesto anual.';
COMMENT ON COLUMN expense_budgets.budgeted_amount IS 'Monto máximo planificado para la categoría en el período.';

-- =============================================
-- 2. EXPENSE RECURRING
-- Plantilla de egresos que se repiten cada mes.
-- El cron job lee esta tabla y genera un registro
-- en `expenses` al inicio de cada período.
-- =============================================
CREATE TABLE expense_recurring (
    id                  BIGSERIAL PRIMARY KEY,
    company_id          BIGINT        NOT NULL,
    category_id         BIGINT        NOT NULL,
    supplier_id         BIGINT        NULL,
    supplier_name_free  VARCHAR(150)  NULL,
    description         TEXT          NOT NULL,
    amount              NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    -- Día del mes en que se genera el egreso (1-28 para evitar problemas de febrero)
    day_of_month        SMALLINT      NOT NULL CHECK (day_of_month BETWEEN 1 AND 28),
    voucher_type        VARCHAR(30)   NULL
                        CHECK (voucher_type IN (
                            'FACTURA','NOTA_VENTA','RECIBO',
                            'LIQUIDACION','SIN_COMPROBANTE','OTRO'
                        )),
    -- Método de pago habitual (orientativo; puede cambiarse al ejecutar)
    default_payment_method VARCHAR(20) NULL
                        CHECK (default_payment_method IN (
                            'EFECTIVO','TRANSFERENCIA',
                            'TARJETA_DEBITO','TARJETA_CREDITO',
                            'CHEQUE','OTRO'
                        )),
    is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
    -- Rango de vigencia del recurrente
    starts_at           DATE          NOT NULL DEFAULT CURRENT_DATE,
    ends_at             DATE          NULL,
    -- Control del cron: última vez que se generó un egreso
    last_generated_at   DATE          NULL,
    created_by          BIGINT        NOT NULL,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ   NULL,
    CONSTRAINT fk_er_company          FOREIGN KEY (company_id)  REFERENCES companies(id),
    CONSTRAINT fk_er_category_company FOREIGN KEY (category_id, company_id)
                                      REFERENCES expense_categories(id, company_id),
    CONSTRAINT fk_er_supplier_company FOREIGN KEY (supplier_id, company_id)
                                      REFERENCES suppliers(id, company_id),
    CONSTRAINT fk_er_created_by       FOREIGN KEY (created_by)  REFERENCES users(id),
    CONSTRAINT chk_er_supplier_required
        CHECK (supplier_id IS NOT NULL OR supplier_name_free IS NOT NULL),
    CONSTRAINT chk_er_dates
        CHECK (ends_at IS NULL OR ends_at > starts_at)
);

COMMENT ON TABLE  expense_recurring                   IS 'Plantillas de egresos recurrentes. El cron genera un registro en expenses cada mes según day_of_month.';
COMMENT ON COLUMN expense_recurring.day_of_month      IS 'Día del mes (1-28) en que el cron genera el egreso. Máximo 28 para compatibilidad con febrero.';
COMMENT ON COLUMN expense_recurring.last_generated_at IS 'Fecha de la última generación automática. El cron la compara con el mes actual para evitar duplicados.';
COMMENT ON COLUMN expense_recurring.default_payment_method IS 'Método de pago habitual, orientativo. El usuario puede cambiarlo al registrar el pago real.';

-- =============================================
-- 3. PETTY CASH (caja chica)
-- Cada apertura es una sesión de caja chica.
-- Estado: OPEN → CLOSED
-- Solo puede haber una caja OPEN por empresa.
-- =============================================
CREATE TABLE petty_cash (
    id              BIGSERIAL PRIMARY KEY,
    company_id      BIGINT        NOT NULL,
    name            VARCHAR(100)  NOT NULL DEFAULT 'Caja Chica',
    opening_amount  NUMERIC(12,2) NOT NULL CHECK (opening_amount > 0),
    -- Monto actual disponible (se recalcula en el backend al registrar movimientos)
    current_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
    status          VARCHAR(10)   NOT NULL DEFAULT 'OPEN'
                    CHECK (status IN ('OPEN','CLOSED')),
    opened_by       BIGINT        NOT NULL,
    opened_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    closed_by       BIGINT        NULL,
    closed_at       TIMESTAMPTZ   NULL,
    -- Al cierre: monto físico contado por el responsable
    closing_amount_reported NUMERIC(12,2) NULL,
    -- Diferencia entre saldo calculado y monto reportado al cierre
    closing_difference      NUMERIC(12,2)
        GENERATED ALWAYS AS (
            CASE WHEN closing_amount_reported IS NOT NULL
                 THEN closing_amount_reported - current_balance
                 ELSE NULL
            END
        ) STORED,
    notes           TEXT          NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_pc_company    FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_pc_opened_by  FOREIGN KEY (opened_by)  REFERENCES users(id),
    CONSTRAINT fk_pc_closed_by  FOREIGN KEY (closed_by)  REFERENCES users(id),
    CONSTRAINT chk_pc_closed
        CHECK (status = 'OPEN'
            OR (status = 'CLOSED' AND closed_by IS NOT NULL AND closed_at IS NOT NULL))
);

-- Solo una caja OPEN por empresa
CREATE UNIQUE INDEX uq_pc_one_open_per_company
    ON petty_cash(company_id)
    WHERE status = 'OPEN';

COMMENT ON TABLE  petty_cash                           IS 'Sesiones de caja chica. Solo una OPEN por empresa a la vez.';
COMMENT ON COLUMN petty_cash.current_balance           IS 'Saldo actual calculado por el backend tras cada movimiento.';
COMMENT ON COLUMN petty_cash.closing_difference        IS 'Diferencia entre lo contado físicamente y el saldo calculado. Columna generada.';
COMMENT ON COLUMN petty_cash.closing_amount_reported   IS 'Dinero físico contado al cerrar la caja. El backend calcula la diferencia.';

-- =============================================
-- 4. PETTY CASH MOVEMENTS
-- Cada gasto o reposición de la caja chica.
-- movement_type:
--   EXPENSE     → salida de dinero (gasto menor)
--   REPLENISH   → reposición del fondo
--   ADJUSTMENT  → ajuste manual (diferencias)
-- =============================================
CREATE TABLE petty_cash_movements (
    id              BIGSERIAL PRIMARY KEY,
    petty_cash_id   BIGINT        NOT NULL,
    company_id      BIGINT        NOT NULL,
    movement_type   VARCHAR(15)   NOT NULL
                    CHECK (movement_type IN ('EXPENSE','REPLENISH','ADJUSTMENT')),
    -- Puede vincularse a una categoría de egreso para reportes unificados
    category_id     BIGINT        NULL,
    amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    description     TEXT          NOT NULL,
    -- Número de voucher del gasto (recibo, nota de venta, etc.)
    voucher_number  VARCHAR(50)   NULL,
    -- Saldo de la caja después de este movimiento (calculado por el backend)
    balance_after   NUMERIC(12,2) NOT NULL,
    created_by      BIGINT        NOT NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_pcm_company       FOREIGN KEY (company_id)   REFERENCES companies(id),
    CONSTRAINT fk_pcm_petty_cash    FOREIGN KEY (petty_cash_id) REFERENCES petty_cash(id),
    CONSTRAINT fk_pcm_category      FOREIGN KEY (category_id, company_id)
                                    REFERENCES expense_categories(id, company_id),
    CONSTRAINT fk_pcm_created_by    FOREIGN KEY (created_by)   REFERENCES users(id)
);

COMMENT ON TABLE  petty_cash_movements               IS 'Movimientos de la caja chica: gastos, reposiciones y ajustes.';
COMMENT ON COLUMN petty_cash_movements.balance_after IS 'Saldo de la caja después del movimiento. Calculado y escrito por el backend.';
COMMENT ON COLUMN petty_cash_movements.category_id   IS 'Categoría del gasto para que aparezca en reportes de egresos unificados.';

-- =============================================
-- 5. VISTA: FLUJO DE CAJA
-- Cruza ingresos (invoice_payments COBRADO) vs
-- egresos pagados (expense_payments PAGADO) por
-- empresa, año y mes.
-- El backend puede leer esta vista directamente
-- para el dashboard financiero.
-- =============================================
CREATE OR REPLACE VIEW v_cash_flow AS
SELECT
    company_id,
    period_year,
    period_month,
    SUM(inflow)         AS total_inflow,
    SUM(outflow)        AS total_outflow,
    SUM(inflow)
        - SUM(outflow)  AS net_cash_flow
FROM (
    -- INGRESOS: cobros de facturas
    SELECT
        ip.company_id,
        EXTRACT(YEAR  FROM ip.payment_date)::SMALLINT AS period_year,
        EXTRACT(MONTH FROM ip.payment_date)::SMALLINT AS period_month,
        ip.amount   AS inflow,
        0::NUMERIC  AS outflow
    FROM invoice_payments ip
    WHERE ip.status = 'COBRADO'

    UNION ALL

    -- EGRESOS: pagos de egresos operacionales
    SELECT
        ep.company_id,
        EXTRACT(YEAR  FROM ep.payment_date)::SMALLINT AS period_year,
        EXTRACT(MONTH FROM ep.payment_date)::SMALLINT AS period_month,
        0::NUMERIC  AS inflow,
        ep.amount   AS outflow
    FROM expense_payments ep
    WHERE ep.status = 'PAGADO'

    UNION ALL

    -- EGRESOS: movimientos de caja chica (gastos)
    SELECT
        pcm.company_id,
        EXTRACT(YEAR  FROM pcm.created_at)::SMALLINT  AS period_year,
        EXTRACT(MONTH FROM pcm.created_at)::SMALLINT  AS period_month,
        0::NUMERIC  AS inflow,
        pcm.amount  AS outflow
    FROM petty_cash_movements pcm
    WHERE pcm.movement_type = 'EXPENSE'
) flows
GROUP BY company_id, period_year, period_month;

COMMENT ON VIEW v_cash_flow IS
    'Flujo de caja mensual por empresa. Cruza invoice_payments (COBRADO) + expense_payments (PAGADO) + petty_cash_movements (EXPENSE).';

-- =============================================
-- 6. VISTA: DEDUCIBILIDAD TRIBUTARIA
-- Agrupa egresos por categoría y marca si son
-- deducibles según la normativa SRI Ecuador.
-- Útil para que el contador optimice la carga
-- tributaria antes del cierre fiscal.
--
-- Referencia: LORTI Art. 10 + Reglamento LORTI
-- Categorías deducibles = reducen base imponible
-- de Impuesto a la Renta.
-- =============================================
CREATE OR REPLACE VIEW v_tax_deduction AS
SELECT
    e.company_id,
    ec.name                                         AS category_name,
    ec.category_type,
    -- Clasificación de deducibilidad según LORTI Ecuador
    CASE ec.category_type
        WHEN 'ADMINISTRATIVO'   THEN TRUE   -- arriendos, servicios básicos: deducibles
        WHEN 'OPERATIVO'        THEN TRUE   -- materia prima, transporte: deducibles
        WHEN 'VENTAS'           THEN TRUE   -- publicidad hasta 4% de ingresos: deducible
        WHEN 'RECURSOS_HUMANOS' THEN TRUE   -- sueldos, IESS patronal, décimos: deducibles
        WHEN 'FINANCIERO'       THEN TRUE   -- intereses: deducibles con límites
        WHEN 'TRIBUTARIO'       THEN FALSE  -- IVA, IR: NO deducibles (son el impuesto mismo)
        WHEN 'INVENTARIO'       THEN TRUE   -- costo de ventas: deducible
        WHEN 'IMPREVISTO'       THEN FALSE  -- multas: NO deducibles (Art. 35 LORTI)
        ELSE FALSE
    END                                             AS is_deductible,
    -- Nota legal orientativa para el contador
    CASE ec.category_type
        WHEN 'ADMINISTRATIVO'   THEN 'Deducible: gastos necesarios para la actividad (Art. 10 LORTI)'
        WHEN 'OPERATIVO'        THEN 'Deducible: costos de producción y operación (Art. 10 LORTI)'
        WHEN 'VENTAS'           THEN 'Publicidad deducible hasta el 4% de los ingresos gravados (Art. 10 num. 14 LORTI)'
        WHEN 'RECURSOS_HUMANOS' THEN 'Deducible: remuneraciones, beneficios de ley y aportes al IESS (Art. 10 num. 9 LORTI)'
        WHEN 'FINANCIERO'       THEN 'Intereses deducibles con límite: tasa BCE + 3 puntos (Art. 10 num. 2 LORTI)'
        WHEN 'TRIBUTARIO'       THEN 'NO deducible: los impuestos propios no reducen la base (Art. 35 num. 3 LORTI)'
        WHEN 'INVENTARIO'       THEN 'Deducible: costo de ventas y mermas debidamente documentadas (Art. 10 LORTI)'
        WHEN 'IMPREVISTO'       THEN 'NO deducible: multas y sanciones (Art. 35 num. 4 LORTI)'
        ELSE 'Verificar con el contador'
    END                                             AS sri_note,
    EXTRACT(YEAR  FROM e.expense_date)::SMALLINT    AS fiscal_year,
    EXTRACT(MONTH FROM e.expense_date)::SMALLINT    AS fiscal_month,
    COUNT(e.id)                                     AS expense_count,
    SUM(e.amount)                                   AS total_amount,
    -- Solo suma egresos con comprobante válido (requisito SRI para deducción)
    SUM(CASE
        WHEN e.voucher_type IN ('FACTURA','LIQUIDACION','NOTA_VENTA') THEN e.amount
        ELSE 0
    END)                                            AS amount_with_valid_voucher,
    -- Monto sin comprobante válido = en riesgo de no ser aceptado por SRI
    SUM(CASE
        WHEN e.voucher_type NOT IN ('FACTURA','LIQUIDACION','NOTA_VENTA')
             OR e.voucher_type IS NULL THEN e.amount
        ELSE 0
    END)                                            AS amount_at_risk
FROM expenses e
JOIN expense_categories ec
    ON ec.id = e.category_id AND ec.company_id = e.company_id
WHERE e.deleted_at IS NULL
  AND e.payment_status != 'ANULADO'
GROUP BY
    e.company_id,
    ec.name,
    ec.category_type,
    fiscal_year,
    fiscal_month;

COMMENT ON VIEW v_tax_deduction IS
    'Resumen de deducibilidad tributaria por categoría y período, según LORTI Ecuador. '
    'amount_with_valid_voucher = monto respaldado con factura/liquidación/nota de venta. '
    'amount_at_risk = monto sin comprobante válido, puede ser rechazado por el SRI.';

-- =============================================
-- 7. ÍNDICES OPERATIVOS
-- =============================================
CREATE INDEX idx_eb_company   ON expense_budgets(company_id);
CREATE INDEX idx_eb_category  ON expense_budgets(category_id);
CREATE INDEX idx_eb_period    ON expense_budgets(company_id, period_year, period_month);

CREATE INDEX idx_er_company   ON expense_recurring(company_id)  WHERE deleted_at IS NULL;
CREATE INDEX idx_er_active    ON expense_recurring(company_id, is_active)
    WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_er_cron      ON expense_recurring(last_generated_at)
    WHERE is_active = TRUE AND deleted_at IS NULL;

CREATE INDEX idx_pc_company   ON petty_cash(company_id);
CREATE INDEX idx_pc_status    ON petty_cash(company_id, status);

CREATE INDEX idx_pcm_petty    ON petty_cash_movements(petty_cash_id);
CREATE INDEX idx_pcm_company  ON petty_cash_movements(company_id);
CREATE INDEX idx_pcm_category ON petty_cash_movements(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX idx_pcm_date     ON petty_cash_movements(company_id, created_at);

-- =============================================
-- 8. TRIGGERS — updated_at automático
-- =============================================
DO $$
DECLARE t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'expense_budgets',
        'expense_recurring',
        'petty_cash'
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
-- 9. TRIGGERS — auditoría automática
-- =============================================
DO $$
DECLARE t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'expense_budgets',
        'expense_recurring',
        'petty_cash',
        'petty_cash_movements'
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
-- RESUMEN SCHEMA v7
-- =============================================
-- NUEVAS TABLAS:
--   expense_budgets       → presupuesto por categoría/período (MONTHLY/ANNUAL)
--   expense_recurring     → plantillas de egresos mensuales automáticos (cron)
--   petty_cash            → sesiones de caja chica (apertura/cierre)
--   petty_cash_movements  → movimientos de caja chica (gastos/reposiciones)
--
-- NUEVAS VISTAS:
--   v_cash_flow     → flujo de caja mensual (ingresos vs egresos vs caja chica)
--   v_tax_deduction → deducibilidad tributaria por categoría (LORTI Ecuador)
--
-- NOTAS BACKEND:
--   · expense_recurring: el cron debe correr diariamente, comparar
--     last_generated_at con el mes actual y generar el expense si corresponde.
--   · petty_cash: al registrar un petty_cash_movement, el backend debe
--     actualizar current_balance en petty_cash.
--   · v_tax_deduction: usar para el reporte fiscal mensual/anual.
--     El campo amount_at_risk alerta egresos sin comprobante válido SRI.
-- =============================================
