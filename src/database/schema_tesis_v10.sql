-- =============================================
-- PYMEFLOWEC · ERP MULTITENANT — SCHEMA v10
-- PostgreSQL 15+  |  Schema unificado completo
--
-- Cambios respecto a v9:
--   + product_categories — tabla de categorías de productos por tenant
--   + products.category_id — FK a product_categories (nullable)
--   · Módulos fusionados:
--       MOD_INVENTORY   → eliminado (absorbido por MOD_PRODUCTS)
--       MOD_PAYMENTS    → eliminado (absorbido por MOD_INVOICING)
--       MOD_SUPPLIERS   → eliminado (absorbido por MOD_PARAMS)
--       MOD_REPORTS     → eliminado (absorbido por MOD_PARAMS)
--       MOD_AUDIT       → eliminado (absorbido por MOD_PARAMS)
--       MOD_TAX         → eliminado (absorbido por MOD_PARAMS)
--   · MOD_PRODUCTS renombrado: 'Productos e Inventario'
--   · MOD_INVOICING ahora cubre también cobros de facturas
--   · MOD_PARAMS cubre proveedores, impuestos, reportes y auditoría
--
-- TABLAS (24):
--   Core:        roles, companies, users
--   Plataforma:  modules, company_module_requests,
--                company_modules
--   Tienda:      suppliers, store_customers, tax_rates,
--                product_categories, products,
--                invoices, invoice_details,
--                inventory_movements
--   Pagos:       invoice_payments
--   Financiero:  expense_categories, expenses,
--                expense_payments, expense_budgets,
--                expense_recurring
--   Caja Chica:  petty_cash, petty_cash_movements
--   Sistema:     audit_logs, system_logs
--
-- VISTAS (2):
--   v_cash_flow      → flujo de caja mensual
--   v_tax_deduction  → deducibilidad tributaria SRI
--
-- Ejecutar una sola vez en base de datos limpia.
-- =============================================

-- =============================================
-- 0. SCHEMA
-- =============================================
CREATE SCHEMA IF NOT EXISTS erp;
SET search_path TO erp;

-- =============================================
-- 1. ROLES (catálogo global)
-- =============================================
CREATE TABLE roles (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(50)  NOT NULL UNIQUE,
    scope           VARCHAR(20)  NOT NULL CHECK (scope IN ('PLATFORM','STORE')),
    description     VARCHAR(255),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  roles       IS 'Catálogo global de roles. scope=PLATFORM → usuarios del ERP; scope=STORE → usuarios de tienda.';
COMMENT ON COLUMN roles.scope IS 'PLATFORM = admin/soporte ERP | STORE = admin_tienda/vendedor/bodega';

-- =============================================
-- 2. COMPANIES (tenants)
-- =============================================
CREATE TABLE companies (
    id               BIGSERIAL PRIMARY KEY,
    name             VARCHAR(150) NOT NULL,
    business_name    VARCHAR(200),
    ruc              VARCHAR(13)  UNIQUE,
    email            VARCHAR(150),
    phone            VARCHAR(20),
    address          VARCHAR(255),
    invoice_settings JSONB        NOT NULL DEFAULT '{}',
    status           VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                     CHECK (status IN ('ACTIVE','INACTIVE','SUSPENDED','PENDING')),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ  NULL,
    CONSTRAINT chk_companies_ruc_format
        CHECK (ruc IS NULL OR ruc ~ '^[0-9]{13}$')
);

COMMENT ON TABLE  companies                  IS 'Cada fila es un tenant (tienda/negocio). deleted_at = soft-delete.';
COMMENT ON COLUMN companies.invoice_settings IS 'Configuración de personalización de facturas por tenant. Campos: display_name (VARCHAR), template_id (classic|modern|minimal), accent_color (hex #rrggbb), footer_text (VARCHAR), establishment (VARCHAR 3 dígitos, default 001), emission_point (VARCHAR 3 dígitos, default 001).';

-- =============================================
-- 3. USERS
-- company_id NULL  → usuario de plataforma
-- company_id NOT NULL → usuario de tienda
-- =============================================
CREATE TABLE users (
    id                  BIGSERIAL PRIMARY KEY,
    company_id          BIGINT       NULL,
    role_id             BIGINT       NOT NULL,
    full_name           VARCHAR(150) NOT NULL,
    email               VARCHAR(150) NOT NULL UNIQUE,
    password_hash       TEXT         NOT NULL,
    reset_token         TEXT         NULL,
    reset_token_expires TIMESTAMPTZ  NULL,
    status              VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                        CHECK (status IN ('ACTIVE','INACTIVE','LOCKED')),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ  NULL,
    CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_users_role    FOREIGN KEY (role_id)    REFERENCES roles(id)
);

COMMENT ON TABLE  users                     IS 'Usuarios del sistema. company_id NULL = personal de plataforma.';
COMMENT ON COLUMN users.reset_token         IS 'Token de un solo uso para recuperación de contraseña.';
COMMENT ON COLUMN users.reset_token_expires IS 'Expiración del reset_token. NULL = no hay solicitud activa.';

-- =============================================
-- 4. MODULES
-- =============================================
CREATE TABLE modules (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE modules IS 'Catálogo de módulos disponibles en la plataforma.';

-- =============================================
-- 5. COMPANY MODULE REQUESTS
-- =============================================
CREATE TABLE company_module_requests (
    id           BIGSERIAL PRIMARY KEY,
    company_id   BIGINT       NOT NULL,
    module_id    BIGINT       NOT NULL,
    requested_by BIGINT       NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                 CHECK (status IN ('PENDING','APPROVED','REJECTED','REVOKED')),
    reviewed_by  BIGINT       NULL,
    reviewed_at  TIMESTAMPTZ  NULL,
    expires_at   TIMESTAMPTZ  NULL,
    comments     TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_cmr_company      FOREIGN KEY (company_id)   REFERENCES companies(id),
    CONSTRAINT fk_cmr_module       FOREIGN KEY (module_id)    REFERENCES modules(id),
    CONSTRAINT fk_cmr_requested_by FOREIGN KEY (requested_by) REFERENCES users(id),
    CONSTRAINT fk_cmr_reviewed_by  FOREIGN KEY (reviewed_by)  REFERENCES users(id)
);

COMMENT ON COLUMN company_module_requests.expires_at IS 'Expiración de aprobación temporal. NULL = sin límite.';
COMMENT ON COLUMN company_module_requests.status     IS 'PENDING → APPROVED / REJECTED / REVOKED.';

CREATE UNIQUE INDEX uq_cmr_pending
    ON company_module_requests(company_id, module_id)
    WHERE status = 'PENDING';

-- =============================================
-- 6. COMPANY MODULES
-- =============================================
CREATE TABLE company_modules (
    id          BIGSERIAL PRIMARY KEY,
    company_id  BIGINT       NOT NULL,
    module_id   BIGINT       NOT NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    approved_by BIGINT       NULL,
    approved_at TIMESTAMPTZ  NULL,
    expires_at  TIMESTAMPTZ  NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_cm_company     FOREIGN KEY (company_id)  REFERENCES companies(id),
    CONSTRAINT fk_cm_module      FOREIGN KEY (module_id)   REFERENCES modules(id),
    CONSTRAINT fk_cm_approved_by FOREIGN KEY (approved_by) REFERENCES users(id),
    CONSTRAINT uq_company_module UNIQUE (company_id, module_id)
);

COMMENT ON COLUMN company_modules.expires_at IS 'Si NOT NULL, el acceso al módulo expira en esta fecha. NULL = permanente.';

-- =============================================
-- 7. SUPPLIERS
-- =============================================
CREATE TABLE suppliers (
    id         BIGSERIAL PRIMARY KEY,
    company_id BIGINT       NOT NULL,
    name       VARCHAR(150) NOT NULL,
    ruc        VARCHAR(13),
    phone      VARCHAR(20),
    email      VARCHAR(150),
    address    VARCHAR(255),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ  NULL,
    CONSTRAINT fk_suppliers_company    FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT chk_suppliers_ruc       CHECK (ruc IS NULL OR ruc ~ '^[0-9]{13}$'),
    CONSTRAINT uq_suppliers_id_company UNIQUE (id, company_id)
);

-- =============================================
-- 8. STORE CUSTOMERS
-- FINAL_CONSUMER = 9999999999999
-- =============================================
CREATE TABLE store_customers (
    id              BIGSERIAL PRIMARY KEY,
    company_id      BIGINT       NOT NULL,
    customer_type   VARCHAR(20)  NOT NULL
                    CHECK (customer_type IN ('CEDULA','RUC','FINAL_CONSUMER')),
    document_number VARCHAR(13)  NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150),
    phone           VARCHAR(20),
    address         VARCHAR(255),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ  NULL,
    CONSTRAINT fk_sc_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT chk_sc_doc_by_type CHECK (
        (customer_type = 'CEDULA'          AND document_number ~ '^[0-9]{10}$')
        OR (customer_type = 'RUC'          AND document_number ~ '^[0-9]{13}$')
        OR (customer_type = 'FINAL_CONSUMER' AND document_number = '9999999999999')
    ),
    CONSTRAINT uq_store_customers_id_company UNIQUE (id, company_id)
);

CREATE UNIQUE INDEX uq_sc_company_doc
    ON store_customers(company_id, document_number)
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_sc_final_consumer
    ON store_customers(company_id, customer_type)
    WHERE customer_type = 'FINAL_CONSUMER' AND deleted_at IS NULL;

-- =============================================
-- 9. TAX RATES
-- =============================================
CREATE TABLE tax_rates (
    id          BIGSERIAL PRIMARY KEY,
    company_id  BIGINT       NOT NULL,
    tax_name    VARCHAR(100) NOT NULL,
    percentage  NUMERIC(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    valid_from  DATE         NOT NULL DEFAULT CURRENT_DATE,
    valid_to    DATE         NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_tr_company        FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT chk_tr_dates         CHECK (valid_to IS NULL OR valid_to >= valid_from),
    CONSTRAINT uq_tax_rates_id_company UNIQUE (id, company_id)
);

COMMENT ON TABLE tax_rates IS 'IVA u otros impuestos por tenant. El admin de tienda puede modificar el porcentaje vigente.';

-- =============================================
-- 10. PRODUCT CATEGORIES  [NUEVO v10]
-- Categorías de productos por tenant.
-- =============================================
CREATE TABLE product_categories (
    id          BIGSERIAL PRIMARY KEY,
    company_id  BIGINT        NOT NULL REFERENCES companies(id),
    name        VARCHAR(100)  NOT NULL,
    description TEXT,
    status      VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE'
                CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_product_categories_company ON product_categories(company_id);

COMMENT ON TABLE  product_categories IS 'Categorías de productos por tenant. Permite agrupar el catálogo en familias (ej: Lácteos, Limpieza).';
COMMENT ON COLUMN product_categories.status IS 'ACTIVE = disponible para asignar a productos | INACTIVE = deshabilitada.';

-- =============================================
-- 11. PRODUCTS
-- =============================================
CREATE TABLE products (
    id             BIGSERIAL PRIMARY KEY,
    company_id     BIGINT        NOT NULL,
    supplier_id    BIGINT        NULL,
    category_id    BIGINT        NULL,              -- [NUEVO v10] FK a product_categories
    sku            VARCHAR(50),
    name           VARCHAR(150)  NOT NULL,
    description    TEXT,
    purchase_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (purchase_price >= 0),
    sale_price     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
    stock          INTEGER       NOT NULL DEFAULT 0  CHECK (stock >= 0),
    min_stock      INTEGER       NOT NULL DEFAULT 0  CHECK (min_stock >= 0),
    tax_rate_id    BIGINT        NULL,
    status         VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE'
                   CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at     TIMESTAMPTZ   NULL,
    CONSTRAINT fk_prod_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_products_supplier_company
        FOREIGN KEY (supplier_id, company_id) REFERENCES suppliers(id, company_id),
    CONSTRAINT fk_products_tax_rate_company
        FOREIGN KEY (tax_rate_id, company_id) REFERENCES tax_rates(id, company_id),
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES product_categories(id),
    CONSTRAINT uq_products_id_company UNIQUE (id, company_id)
);

CREATE UNIQUE INDEX uq_prod_company_sku
    ON products(company_id, sku)
    WHERE sku IS NOT NULL AND deleted_at IS NULL;

COMMENT ON COLUMN products.tax_rate_id  IS 'Tasa de impuesto por defecto del producto. NULL = sin impuesto.';
COMMENT ON COLUMN products.category_id  IS 'Categoría del producto. NULL = sin categorizar.';

-- =============================================
-- 12. INVOICES
-- status        → estado documental (ISSUED/CANCELLED)
-- payment_status → estado de cobro (PENDIENTE/PARCIAL/COBRADO/ANULADO)
-- =============================================
CREATE TABLE invoices (
    id              BIGSERIAL PRIMARY KEY,
    company_id      BIGINT        NOT NULL,
    customer_id     BIGINT        NULL,
    invoice_number  VARCHAR(20)   NOT NULL,
    issue_date      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    subtotal        NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    tax_amount      NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    total           NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    status          VARCHAR(20)   NOT NULL DEFAULT 'ISSUED'
                    CHECK (status IN ('ISSUED','CANCELLED')),
    payment_status  VARCHAR(20)   NOT NULL DEFAULT 'PENDIENTE'
                    CHECK (payment_status IN ('PENDIENTE','PARCIAL','COBRADO','ANULADO')),
    created_by      BIGINT        NOT NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ   NULL,
    CONSTRAINT fk_inv_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_invoices_customer_company
        FOREIGN KEY (customer_id, company_id) REFERENCES store_customers(id, company_id),
    CONSTRAINT fk_inv_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT uq_inv_number         UNIQUE (company_id, invoice_number),
    CONSTRAINT uq_invoices_id_company UNIQUE (id, company_id)
);

COMMENT ON COLUMN invoices.payment_status IS 'Estado de cobro. Recalculado por el backend al registrar invoice_payments. Cubierto por MOD_INVOICING.';

-- =============================================
-- 13. INVOICE DETAILS
-- =============================================
CREATE TABLE invoice_details (
    id             BIGSERIAL PRIMARY KEY,
    invoice_id     BIGINT        NOT NULL,
    company_id     BIGINT        NOT NULL,
    product_id     BIGINT        NULL,
    tax_rate_id    BIGINT        NULL,
    product_name   VARCHAR(150)  NOT NULL,
    description    TEXT,
    quantity       INTEGER       NOT NULL CHECK (quantity > 0),
    unit_price     NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    discount       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    tax_percentage NUMERIC(5,2)  NOT NULL DEFAULT 0
                   CHECK (tax_percentage >= 0 AND tax_percentage <= 100),
    tax_amount     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    line_subtotal  NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (line_subtotal >= 0),
    line_total     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (line_total >= 0),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_invd_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_invoice_details_invoice_company
        FOREIGN KEY (invoice_id, company_id) REFERENCES invoices(id, company_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_invoice_details_product_company
        FOREIGN KEY (product_id, company_id) REFERENCES products(id, company_id),
    CONSTRAINT fk_invoice_details_tax_rate_company
        FOREIGN KEY (tax_rate_id, company_id) REFERENCES tax_rates(id, company_id)
);

COMMENT ON COLUMN invoice_details.company_id  IS 'Denormalizado para RLS directo sin JOIN a invoices.';
COMMENT ON COLUMN invoice_details.discount     IS 'Descuento total aplicado a la línea. line_subtotal = unit_price * quantity - discount.';
COMMENT ON COLUMN invoice_details.tax_rate_id IS 'Referencia a la tasa aplicada. tax_percentage guarda el % snapshot.';

-- =============================================
-- 14. INVOICE PAYMENTS
-- Cobros de una factura. Cubiertos por MOD_INVOICING.
-- Soporta múltiples métodos y pago en cuotas.
-- =============================================
CREATE TABLE invoice_payments (
    id                 BIGSERIAL PRIMARY KEY,
    invoice_id         BIGINT        NOT NULL,
    company_id         BIGINT        NOT NULL,
    payment_date       DATE          NOT NULL DEFAULT CURRENT_DATE,
    amount             NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method     VARCHAR(20)   NOT NULL
                       CHECK (payment_method IN (
                           'EFECTIVO','TRANSFERENCIA',
                           'TARJETA_DEBITO','TARJETA_CREDITO',
                           'CHEQUE','OTRO'
                       )),
    transfer_reference VARCHAR(100)  NULL,
    card_contrapartida VARCHAR(100)  NULL,
    cheque_number      VARCHAR(50)   NULL,
    installment_number SMALLINT      NULL CHECK (installment_number > 0),
    installment_total  SMALLINT      NULL CHECK (installment_total > 0),
    due_date           DATE          NULL,
    status             VARCHAR(20)   NOT NULL DEFAULT 'COBRADO'
                       CHECK (status IN ('PENDIENTE','COBRADO','VENCIDO','ANULADO')),
    notes              TEXT          NULL,
    created_by         BIGINT        NOT NULL,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_ip_company         FOREIGN KEY (company_id)  REFERENCES companies(id),
    CONSTRAINT fk_ip_invoice_company FOREIGN KEY (invoice_id, company_id)
                                     REFERENCES invoices(id, company_id)
                                     ON DELETE CASCADE,
    CONSTRAINT fk_ip_created_by      FOREIGN KEY (created_by)  REFERENCES users(id),
    CONSTRAINT chk_ip_transfer_ref
        CHECK (payment_method != 'TRANSFERENCIA'
               OR status = 'PENDIENTE'
               OR transfer_reference IS NOT NULL),
    CONSTRAINT chk_ip_card_contrapartida
        CHECK (payment_method NOT IN ('TARJETA_DEBITO','TARJETA_CREDITO')
               OR status = 'PENDIENTE'
               OR card_contrapartida IS NOT NULL),
    CONSTRAINT chk_ip_installments
        CHECK ((installment_number IS NULL AND installment_total IS NULL)
               OR (installment_number IS NOT NULL AND installment_total IS NOT NULL
                   AND installment_number <= installment_total))
);

COMMENT ON TABLE  invoice_payments                    IS 'Cobros asociados a una factura. Cubiertos por MOD_INVOICING (fusión de MOD_PAYMENTS). Soporta múltiples métodos y pago en cuotas.';
COMMENT ON COLUMN invoice_payments.transfer_reference IS 'Número de transacción bancaria (transferencias).';
COMMENT ON COLUMN invoice_payments.card_contrapartida IS 'Código de contrapartida del datafono al cobrar con tarjeta.';
COMMENT ON COLUMN invoice_payments.installment_number IS 'Número de cuota actual (ej: 2 de 3).';
COMMENT ON COLUMN invoice_payments.installment_total  IS 'Total de cuotas pactadas con el cliente.';
COMMENT ON COLUMN invoice_payments.due_date           IS 'Fecha límite de la cuota. NULL = cobro inmediato.';
COMMENT ON COLUMN invoice_payments.status             IS 'PENDIENTE = cuota futura | COBRADO = recibido | VENCIDO = pasó due_date | ANULADO.';

-- =============================================
-- 15. INVENTORY MOVEMENTS
-- =============================================
CREATE TABLE inventory_movements (
    id             BIGSERIAL PRIMARY KEY,
    company_id     BIGINT       NOT NULL,
    product_id     BIGINT       NOT NULL,
    movement_type  VARCHAR(20)  NOT NULL
                   CHECK (movement_type IN ('IN','OUT','ADJUSTMENT')),
    quantity       INTEGER      NOT NULL CHECK (quantity > 0),
    reference_type VARCHAR(20)  NOT NULL
                   CHECK (reference_type IN ('PURCHASE','SALE','MANUAL')),
    reference_id   BIGINT       NULL,
    notes          TEXT,
    created_by     BIGINT       NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_im_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_inventory_movements_product_company
        FOREIGN KEY (product_id, company_id) REFERENCES products(id, company_id),
    CONSTRAINT fk_im_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- =============================================
-- 16. EXPENSE CATEGORIES
-- Catálogo de categorías de egresos por tenant.
-- =============================================
CREATE TABLE expense_categories (
    id            BIGSERIAL PRIMARY KEY,
    company_id    BIGINT       NOT NULL,
    name          VARCHAR(100) NOT NULL,
    category_type VARCHAR(30)  NOT NULL
                  CHECK (category_type IN (
                      'ADMINISTRATIVO','OPERATIVO','VENTAS',
                      'FINANCIERO','TRIBUTARIO','RECURSOS_HUMANOS',
                      'INVENTARIO','IMPREVISTO'
                  )),
    description   VARCHAR(255),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ  NULL,
    CONSTRAINT fk_ec_company    FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT uq_ec_id_company UNIQUE (id, company_id)
);

COMMENT ON TABLE  expense_categories               IS 'Catálogo de categorías de egresos por tenant.';
COMMENT ON COLUMN expense_categories.category_type IS 'Tipo macro del egreso según clasificación PymeFlowEc.';

-- =============================================
-- 17. EXPENSES (cabecera del egreso)
-- =============================================
CREATE TABLE expenses (
    id                 BIGSERIAL PRIMARY KEY,
    company_id         BIGINT        NOT NULL,
    category_id        BIGINT        NOT NULL,
    supplier_id        BIGINT        NULL,
    supplier_name_free VARCHAR(150)  NULL,
    description        TEXT          NOT NULL,
    expense_date       DATE          NOT NULL DEFAULT CURRENT_DATE,
    amount             NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    voucher_number     VARCHAR(50)   NULL,
    voucher_type       VARCHAR(30)   NULL
                       CHECK (voucher_type IN (
                           'FACTURA','NOTA_VENTA','RECIBO',
                           'LIQUIDACION','SIN_COMPROBANTE','OTRO'
                       )),
    payment_status     VARCHAR(20)   NOT NULL DEFAULT 'PENDIENTE'
                       CHECK (payment_status IN ('PENDIENTE','PARCIAL','PAGADO','ANULADO')),
    notes              TEXT          NULL,
    created_by         BIGINT        NOT NULL,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at         TIMESTAMPTZ   NULL,
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

COMMENT ON TABLE  expenses                    IS 'Egresos operacionales. Un egreso puede pagarse en cuotas via expense_payments.';
COMMENT ON COLUMN expenses.supplier_name_free IS 'Nombre libre cuando el proveedor no está en la tabla suppliers.';
COMMENT ON COLUMN expenses.payment_status     IS 'Recalculado por el backend: suma pagos PAGADO vs monto total.';
COMMENT ON COLUMN expenses.voucher_number     IS 'Número del comprobante de respaldo (factura recibida, recibo, etc.).';

-- =============================================
-- 18. EXPENSE PAYMENTS
-- Pagos de un egreso. Soporta cuotas.
-- =============================================
CREATE TABLE expense_payments (
    id                 BIGSERIAL PRIMARY KEY,
    expense_id         BIGINT        NOT NULL,
    company_id         BIGINT        NOT NULL,
    payment_date       DATE          NOT NULL DEFAULT CURRENT_DATE,
    amount             NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method     VARCHAR(20)   NOT NULL
                       CHECK (payment_method IN (
                           'EFECTIVO','TRANSFERENCIA',
                           'TARJETA_DEBITO','TARJETA_CREDITO',
                           'CHEQUE','OTRO'
                       )),
    transfer_reference VARCHAR(100)  NULL,
    card_contrapartida VARCHAR(100)  NULL,
    cheque_number      VARCHAR(50)   NULL,
    installment_number SMALLINT      NULL CHECK (installment_number > 0),
    installment_total  SMALLINT      NULL CHECK (installment_total > 0),
    due_date           DATE          NULL,
    status             VARCHAR(20)   NOT NULL DEFAULT 'PAGADO'
                       CHECK (status IN ('PENDIENTE','PAGADO','VENCIDO','ANULADO')),
    notes              TEXT          NULL,
    created_by         BIGINT        NOT NULL,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_ep_company         FOREIGN KEY (company_id)  REFERENCES companies(id),
    CONSTRAINT fk_ep_expense_company FOREIGN KEY (expense_id, company_id)
                                     REFERENCES expenses(id, company_id)
                                     ON DELETE CASCADE,
    CONSTRAINT fk_ep_created_by      FOREIGN KEY (created_by)  REFERENCES users(id),
    CONSTRAINT chk_ep_transfer_ref
        CHECK (payment_method != 'TRANSFERENCIA'
               OR status = 'PENDIENTE'
               OR transfer_reference IS NOT NULL),
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
COMMENT ON COLUMN expense_payments.card_contrapartida IS 'Código de contrapartida del datafono al pagar con tarjeta.';
COMMENT ON COLUMN expense_payments.installment_number IS 'Número de cuota actual (ej: 1 de 3).';
COMMENT ON COLUMN expense_payments.installment_total  IS 'Total de cuotas acordadas.';
COMMENT ON COLUMN expense_payments.due_date           IS 'Fecha límite de la cuota. NULL = pago inmediato.';

-- =============================================
-- 19. EXPENSE BUDGETS
-- Presupuesto de egresos por categoría/período.
-- =============================================
CREATE TABLE expense_budgets (
    id              BIGSERIAL PRIMARY KEY,
    company_id      BIGINT        NOT NULL,
    category_id     BIGINT        NOT NULL,
    period_type     VARCHAR(10)   NOT NULL CHECK (period_type IN ('MONTHLY','ANNUAL')),
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
    CONSTRAINT uq_eb_category_period  UNIQUE (company_id, category_id, period_type, period_year, period_month),
    CONSTRAINT chk_eb_period_month
        CHECK ((period_type = 'MONTHLY' AND period_month IS NOT NULL)
            OR (period_type = 'ANNUAL'  AND period_month IS NULL))
);

COMMENT ON TABLE  expense_budgets                IS 'Presupuesto de egresos por categoría y período. Comparar con SUM(expenses.amount) del mismo período.';
COMMENT ON COLUMN expense_budgets.period_year    IS 'Año del presupuesto (ej: 2025).';
COMMENT ON COLUMN expense_budgets.period_month   IS 'Mes 1-12 para presupuesto mensual. NULL para presupuesto anual.';
COMMENT ON COLUMN expense_budgets.budgeted_amount IS 'Monto máximo planificado para la categoría en el período.';

-- =============================================
-- 20. EXPENSE RECURRING
-- Plantillas de egresos mensuales automáticos.
-- =============================================
CREATE TABLE expense_recurring (
    id                     BIGSERIAL PRIMARY KEY,
    company_id             BIGINT        NOT NULL,
    category_id            BIGINT        NOT NULL,
    supplier_id            BIGINT        NULL,
    supplier_name_free     VARCHAR(150)  NULL,
    description            TEXT          NOT NULL,
    amount                 NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    day_of_month           SMALLINT      NOT NULL CHECK (day_of_month BETWEEN 1 AND 28),
    voucher_type           VARCHAR(30)   NULL
                           CHECK (voucher_type IN (
                               'FACTURA','NOTA_VENTA','RECIBO',
                               'LIQUIDACION','SIN_COMPROBANTE','OTRO'
                           )),
    default_payment_method VARCHAR(20)   NULL
                           CHECK (default_payment_method IN (
                               'EFECTIVO','TRANSFERENCIA',
                               'TARJETA_DEBITO','TARJETA_CREDITO',
                               'CHEQUE','OTRO'
                           )),
    is_active              BOOLEAN       NOT NULL DEFAULT TRUE,
    starts_at              DATE          NOT NULL DEFAULT CURRENT_DATE,
    ends_at                DATE          NULL,
    last_generated_at      DATE          NULL,
    created_by             BIGINT        NOT NULL,
    created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at             TIMESTAMPTZ   NULL,
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

COMMENT ON TABLE  expense_recurring                        IS 'Plantillas de egresos recurrentes. El cron genera un registro en expenses cada mes según day_of_month.';
COMMENT ON COLUMN expense_recurring.day_of_month           IS 'Día del mes (1-28) en que el cron genera el egreso. Máximo 28 para compatibilidad con febrero.';
COMMENT ON COLUMN expense_recurring.last_generated_at      IS 'Última generación automática. El cron compara con el mes actual para evitar duplicados.';
COMMENT ON COLUMN expense_recurring.default_payment_method IS 'Método de pago habitual, orientativo. Puede cambiarse al registrar el pago real.';

-- =============================================
-- 21. PETTY CASH (caja chica)
-- Una sola sesión OPEN por empresa a la vez.
-- =============================================
CREATE TABLE petty_cash (
    id                      BIGSERIAL PRIMARY KEY,
    company_id              BIGINT        NOT NULL,
    name                    VARCHAR(100)  NOT NULL DEFAULT 'Caja Chica',
    opening_amount          NUMERIC(12,2) NOT NULL CHECK (opening_amount > 0),
    current_balance         NUMERIC(12,2) NOT NULL DEFAULT 0,
    status                  VARCHAR(10)   NOT NULL DEFAULT 'OPEN'
                            CHECK (status IN ('OPEN','CLOSED')),
    opened_by               BIGINT        NOT NULL,
    opened_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    closed_by               BIGINT        NULL,
    closed_at               TIMESTAMPTZ   NULL,
    closing_amount_reported NUMERIC(12,2) NULL,
    closing_difference      NUMERIC(12,2)
        GENERATED ALWAYS AS (
            CASE WHEN closing_amount_reported IS NOT NULL
                 THEN closing_amount_reported - current_balance
                 ELSE NULL END
        ) STORED,
    notes                   TEXT          NULL,
    created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_pc_company   FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_pc_opened_by FOREIGN KEY (opened_by)  REFERENCES users(id),
    CONSTRAINT fk_pc_closed_by FOREIGN KEY (closed_by)  REFERENCES users(id),
    CONSTRAINT chk_pc_closed
        CHECK (status = 'OPEN'
            OR (status = 'CLOSED' AND closed_by IS NOT NULL AND closed_at IS NOT NULL))
);

CREATE UNIQUE INDEX uq_pc_one_open_per_company
    ON petty_cash(company_id)
    WHERE status = 'OPEN';

COMMENT ON TABLE  petty_cash                           IS 'Sesiones de caja chica. Solo una OPEN por empresa a la vez.';
COMMENT ON COLUMN petty_cash.current_balance           IS 'Saldo actual. El backend lo actualiza tras cada petty_cash_movement.';
COMMENT ON COLUMN petty_cash.closing_difference        IS 'Diferencia entre lo contado físicamente y el saldo calculado. Columna generada.';
COMMENT ON COLUMN petty_cash.closing_amount_reported   IS 'Dinero físico contado al cerrar la caja.';

-- =============================================
-- 22. PETTY CASH MOVEMENTS
-- =============================================
CREATE TABLE petty_cash_movements (
    id             BIGSERIAL PRIMARY KEY,
    petty_cash_id  BIGINT        NOT NULL,
    company_id     BIGINT        NOT NULL,
    movement_type  VARCHAR(15)   NOT NULL
                   CHECK (movement_type IN ('EXPENSE','REPLENISH','ADJUSTMENT')),
    category_id    BIGINT        NULL,
    amount         NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    description    TEXT          NOT NULL,
    voucher_number VARCHAR(50)   NULL,
    balance_after  NUMERIC(12,2) NOT NULL,
    created_by     BIGINT        NOT NULL,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_pcm_company    FOREIGN KEY (company_id)    REFERENCES companies(id),
    CONSTRAINT fk_pcm_petty_cash FOREIGN KEY (petty_cash_id) REFERENCES petty_cash(id),
    CONSTRAINT fk_pcm_category   FOREIGN KEY (category_id, company_id)
                                 REFERENCES expense_categories(id, company_id),
    CONSTRAINT fk_pcm_created_by FOREIGN KEY (created_by)    REFERENCES users(id)
);

COMMENT ON TABLE  petty_cash_movements               IS 'Movimientos de caja chica: gastos, reposiciones y ajustes.';
COMMENT ON COLUMN petty_cash_movements.balance_after IS 'Saldo de la caja después del movimiento. Calculado y escrito por el backend.';
COMMENT ON COLUMN petty_cash_movements.category_id   IS 'Categoría del gasto para reportes de egresos unificados.';

-- =============================================
-- 23. AUDIT LOGS
-- =============================================
CREATE TABLE audit_logs (
    id         BIGSERIAL PRIMARY KEY,
    company_id BIGINT       NULL,
    user_id    BIGINT       NULL,
    action     VARCHAR(50)  NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id  BIGINT       NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_al_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_al_user    FOREIGN KEY (user_id)    REFERENCES users(id)
);

COMMENT ON TABLE audit_logs IS 'Registro de cada INSERT/UPDATE/DELETE. ip_address y user_agent capturados desde el middleware de autenticación.';

-- =============================================
-- 24. SYSTEM LOGS
-- =============================================
CREATE TABLE system_logs (
    id         BIGSERIAL PRIMARY KEY,
    company_id BIGINT       NULL,
    user_id    BIGINT       NULL,
    level      VARCHAR(10)  NOT NULL
               CHECK (level IN ('DEBUG','INFO','WARN','ERROR','FATAL')),
    source     VARCHAR(50)  NOT NULL
               CHECK (source IN ('BACKEND','DATABASE','AUTH','API','CRON')),
    message    TEXT         NOT NULL,
    details    JSONB,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_sl_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_sl_user    FOREIGN KEY (user_id)    REFERENCES users(id)
);

COMMENT ON TABLE system_logs IS 'Logs técnicos. Soporte ERP los consulta para diagnosticar fallos.';

-- =============================================
-- ÍNDICES OPERATIVOS
-- =============================================
-- users
CREATE INDEX idx_users_company ON users(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role    ON users(role_id);
CREATE INDEX idx_users_status  ON users(status)     WHERE deleted_at IS NULL;

-- product_categories
CREATE INDEX idx_pc_cat_status ON product_categories(company_id, status) WHERE deleted_at IS NULL;

-- products
CREATE INDEX idx_prod_company   ON products(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_prod_supplier  ON products(supplier_id);
CREATE INDEX idx_prod_category  ON products(category_id);
CREATE INDEX idx_prod_status    ON products(status)     WHERE deleted_at IS NULL;
CREATE INDEX idx_prod_low_stock ON products(company_id, stock)
    WHERE status = 'ACTIVE' AND deleted_at IS NULL;

-- suppliers / customers
CREATE INDEX idx_supp_company ON suppliers(company_id)       WHERE deleted_at IS NULL;
CREATE INDEX idx_sc_company   ON store_customers(company_id) WHERE deleted_at IS NULL;

-- invoices
CREATE INDEX idx_inv_company    ON invoices(company_id)             WHERE deleted_at IS NULL;
CREATE INDEX idx_inv_customer   ON invoices(customer_id);
CREATE INDEX idx_inv_created_by ON invoices(created_by);
CREATE INDEX idx_inv_issue_date ON invoices(issue_date);
CREATE INDEX idx_inv_status     ON invoices(company_id, status)     WHERE deleted_at IS NULL;
CREATE INDEX idx_inv_pay_status ON invoices(company_id, payment_status) WHERE deleted_at IS NULL;

-- invoice_details
CREATE INDEX idx_invd_invoice ON invoice_details(invoice_id);
CREATE INDEX idx_invd_product ON invoice_details(product_id);
CREATE INDEX idx_invd_company ON invoice_details(company_id);

-- invoice_payments
CREATE INDEX idx_ip_invoice ON invoice_payments(invoice_id);
CREATE INDEX idx_ip_company ON invoice_payments(company_id);
CREATE INDEX idx_ip_date    ON invoice_payments(company_id, payment_date);
CREATE INDEX idx_ip_due     ON invoice_payments(due_date)
    WHERE status = 'PENDIENTE' AND due_date IS NOT NULL;

-- inventory_movements
CREATE INDEX idx_im_company    ON inventory_movements(company_id);
CREATE INDEX idx_im_product    ON inventory_movements(product_id);
CREATE INDEX idx_im_created_at ON inventory_movements(created_at);

-- expense_categories
CREATE INDEX idx_ec_company ON expense_categories(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_ec_type    ON expense_categories(company_id, category_type);

-- expenses
CREATE INDEX idx_exp_company  ON expenses(company_id)             WHERE deleted_at IS NULL;
CREATE INDEX idx_exp_category ON expenses(category_id);
CREATE INDEX idx_exp_supplier ON expenses(supplier_id)            WHERE supplier_id IS NOT NULL;
CREATE INDEX idx_exp_date     ON expenses(company_id, expense_date);
CREATE INDEX idx_exp_status   ON expenses(company_id, payment_status) WHERE deleted_at IS NULL;

-- expense_payments
CREATE INDEX idx_ep_expense ON expense_payments(expense_id);
CREATE INDEX idx_ep_company ON expense_payments(company_id);
CREATE INDEX idx_ep_due     ON expense_payments(due_date)
    WHERE status = 'PENDIENTE' AND due_date IS NOT NULL;

-- expense_budgets
CREATE INDEX idx_eb_company  ON expense_budgets(company_id);
CREATE INDEX idx_eb_category ON expense_budgets(category_id);
CREATE INDEX idx_eb_period   ON expense_budgets(company_id, period_year, period_month);

-- expense_recurring
CREATE INDEX idx_er_company ON expense_recurring(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_er_active  ON expense_recurring(company_id, is_active)
    WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_er_cron    ON expense_recurring(last_generated_at)
    WHERE is_active = TRUE AND deleted_at IS NULL;

-- petty_cash
CREATE INDEX idx_pc_company ON petty_cash(company_id);
CREATE INDEX idx_pc_status  ON petty_cash(company_id, status);

-- petty_cash_movements
CREATE INDEX idx_pcm_petty    ON petty_cash_movements(petty_cash_id);
CREATE INDEX idx_pcm_company  ON petty_cash_movements(company_id);
CREATE INDEX idx_pcm_category ON petty_cash_movements(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX idx_pcm_date     ON petty_cash_movements(company_id, created_at);

-- audit / system logs
CREATE INDEX idx_al_company    ON audit_logs(company_id);
CREATE INDEX idx_al_user       ON audit_logs(user_id);
CREATE INDEX idx_al_table      ON audit_logs(table_name);
CREATE INDEX idx_al_created_at ON audit_logs(created_at);
CREATE INDEX idx_sl_company    ON system_logs(company_id);
CREATE INDEX idx_sl_level      ON system_logs(level);
CREATE INDEX idx_sl_created_at ON system_logs(created_at);

-- company_modules expiry (cron)
CREATE INDEX idx_cm_expiry ON company_modules(expires_at)
    WHERE is_active = TRUE AND expires_at IS NOT NULL;

-- =============================================
-- FUNCIÓN: updated_at automático
-- =============================================
CREATE OR REPLACE FUNCTION erp.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'roles','companies','users','modules',
        'company_module_requests','company_modules',
        'suppliers','store_customers','tax_rates',
        'product_categories','products','invoices',
        'expense_categories','expenses','expense_payments',
        'invoice_payments','expense_budgets','expense_recurring','petty_cash'
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
-- FUNCIÓN: validar coherencia company_id / scope
-- =============================================
CREATE OR REPLACE FUNCTION erp.fn_validate_user_role_scope()
RETURNS TRIGGER AS $$
DECLARE v_scope VARCHAR(20);
BEGIN
    SELECT scope INTO v_scope FROM erp.roles WHERE id = NEW.role_id;
    IF v_scope IS NULL THEN
        RAISE EXCEPTION 'El role_id % no existe o no tiene scope válido.', NEW.role_id;
    END IF;
    IF v_scope = 'PLATFORM' AND NEW.company_id IS NOT NULL THEN
        RAISE EXCEPTION 'Un usuario con rol PLATFORM no puede tener company_id.';
    END IF;
    IF v_scope = 'STORE' AND NEW.company_id IS NULL THEN
        RAISE EXCEPTION 'Un usuario con rol STORE debe tener company_id.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_user_role_scope
BEFORE INSERT OR UPDATE ON erp.users
FOR EACH ROW EXECUTE FUNCTION erp.fn_validate_user_role_scope();

-- =============================================
-- FUNCIÓN: auditoría automática
-- =============================================
CREATE OR REPLACE FUNCTION erp.fn_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_company_id BIGINT;
    v_user_id    BIGINT;
    v_action     VARCHAR(10);
    v_record_id  BIGINT;
    v_old        JSONB := NULL;
    v_new        JSONB := NULL;
    v_row        JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_action := 'INSERT'; v_new := to_jsonb(NEW); v_row := v_new;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE'; v_old := to_jsonb(OLD); v_new := to_jsonb(NEW); v_row := v_new;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE'; v_old := to_jsonb(OLD); v_row := v_old;
    END IF;

    v_record_id := (v_row ->> 'id')::BIGINT;

    IF TG_TABLE_NAME = 'companies' THEN
        v_company_id := v_record_id;
    ELSIF v_row ? 'company_id' THEN
        v_company_id := (v_row ->> 'company_id')::BIGINT;
    ELSE
        v_company_id := NULL;
    END IF;

    BEGIN
        v_user_id := current_setting('app.current_user_id', TRUE)::BIGINT;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    INSERT INTO erp.audit_logs (
        company_id, user_id, action, table_name, record_id, old_values, new_values
    ) VALUES (
        v_company_id, v_user_id, v_action, TG_TABLE_NAME, v_record_id, v_old, v_new
    );

    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'companies','users','suppliers','store_customers','tax_rates',
        'product_categories','products','invoices','invoice_details','invoice_payments',
        'inventory_movements','company_modules','company_module_requests',
        'expense_categories','expenses','expense_payments',
        'expense_budgets','expense_recurring',
        'petty_cash','petty_cash_movements'
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
-- VISTA: FLUJO DE CAJA MENSUAL
-- =============================================
CREATE OR REPLACE VIEW v_cash_flow AS
SELECT
    company_id,
    period_year,
    period_month,
    SUM(inflow)            AS total_inflow,
    SUM(outflow)           AS total_outflow,
    SUM(inflow) - SUM(outflow) AS net_cash_flow
FROM (
    SELECT
        ip.company_id,
        EXTRACT(YEAR  FROM ip.payment_date)::SMALLINT AS period_year,
        EXTRACT(MONTH FROM ip.payment_date)::SMALLINT AS period_month,
        ip.amount  AS inflow,
        0::NUMERIC AS outflow
    FROM invoice_payments ip
    WHERE ip.status = 'COBRADO'

    UNION ALL

    SELECT
        ep.company_id,
        EXTRACT(YEAR  FROM ep.payment_date)::SMALLINT AS period_year,
        EXTRACT(MONTH FROM ep.payment_date)::SMALLINT AS period_month,
        0::NUMERIC AS inflow,
        ep.amount  AS outflow
    FROM expense_payments ep
    WHERE ep.status = 'PAGADO'

    UNION ALL

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
-- VISTA: DEDUCIBILIDAD TRIBUTARIA (LORTI)
-- =============================================
CREATE OR REPLACE VIEW v_tax_deduction AS
SELECT
    e.company_id,
    ec.name                                          AS category_name,
    ec.category_type,
    CASE ec.category_type
        WHEN 'ADMINISTRATIVO'   THEN TRUE
        WHEN 'OPERATIVO'        THEN TRUE
        WHEN 'VENTAS'           THEN TRUE
        WHEN 'RECURSOS_HUMANOS' THEN TRUE
        WHEN 'FINANCIERO'       THEN TRUE
        WHEN 'INVENTARIO'       THEN TRUE
        WHEN 'TRIBUTARIO'       THEN FALSE
        WHEN 'IMPREVISTO'       THEN FALSE
        ELSE FALSE
    END                                              AS is_deductible,
    CASE ec.category_type
        WHEN 'ADMINISTRATIVO'   THEN 'Deducible: gastos necesarios para la actividad (Art. 10 LORTI)'
        WHEN 'OPERATIVO'        THEN 'Deducible: costos de producción y operación (Art. 10 LORTI)'
        WHEN 'VENTAS'           THEN 'Publicidad deducible hasta el 4% de los ingresos gravados (Art. 10 num. 14 LORTI)'
        WHEN 'RECURSOS_HUMANOS' THEN 'Deducible: remuneraciones, beneficios de ley y aportes al IESS (Art. 10 num. 9 LORTI)'
        WHEN 'FINANCIERO'       THEN 'Intereses deducibles con límite: tasa BCE + 3 puntos (Art. 10 num. 2 LORTI)'
        WHEN 'INVENTARIO'       THEN 'Deducible: costo de ventas y mermas documentadas (Art. 10 LORTI)'
        WHEN 'TRIBUTARIO'       THEN 'NO deducible: los impuestos propios no reducen la base (Art. 35 num. 3 LORTI)'
        WHEN 'IMPREVISTO'       THEN 'NO deducible: multas y sanciones (Art. 35 num. 4 LORTI)'
        ELSE 'Verificar con el contador'
    END                                              AS sri_note,
    EXTRACT(YEAR  FROM e.expense_date)::SMALLINT     AS fiscal_year,
    EXTRACT(MONTH FROM e.expense_date)::SMALLINT     AS fiscal_month,
    COUNT(e.id)                                      AS expense_count,
    SUM(e.amount)                                    AS total_amount,
    SUM(CASE
        WHEN e.voucher_type IN ('FACTURA','LIQUIDACION','NOTA_VENTA') THEN e.amount
        ELSE 0 END)                                  AS amount_with_valid_voucher,
    SUM(CASE
        WHEN e.voucher_type NOT IN ('FACTURA','LIQUIDACION','NOTA_VENTA')
             OR e.voucher_type IS NULL THEN e.amount
        ELSE 0 END)                                  AS amount_at_risk
FROM expenses e
JOIN expense_categories ec
    ON ec.id = e.category_id AND ec.company_id = e.company_id
WHERE e.deleted_at IS NULL
  AND e.payment_status != 'ANULADO'
GROUP BY e.company_id, ec.name, ec.category_type, fiscal_year, fiscal_month;

COMMENT ON VIEW v_tax_deduction IS
    'Resumen de deducibilidad tributaria por categoría y período, según LORTI Ecuador. '
    'amount_with_valid_voucher = monto con factura/liquidación/nota de venta. '
    'amount_at_risk = monto sin comprobante válido SRI.';

-- =============================================
-- RESUMEN SCHEMA v10
-- =============================================
-- 24 TABLAS:
--   1.  roles                    9.  tax_rates            17. expenses
--   2.  companies               10.  product_categories   18. expense_payments
--   3.  users                   11.  products             19. expense_budgets
--   4.  modules                 12.  invoices             20. expense_recurring
--   5.  company_module_requests 13.  invoice_details      21. petty_cash
--   6.  company_modules         14.  invoice_payments     22. petty_cash_movements
--   7.  suppliers               15.  inventory_movements  23. audit_logs
--   8.  store_customers         16.  expense_categories   24. system_logs
--
-- 2 VISTAS:
--   v_cash_flow      → flujo de caja mensual
--   v_tax_deduction  → deducibilidad tributaria SRI (LORTI)
--
-- CAMBIOS v9 → v10:
--   + Tabla product_categories (categorías de productos por tenant)
--   + products.category_id FK a product_categories
--   · Módulos consolidados a 4: MOD_INVOICING, MOD_PRODUCTS, MOD_FINANCE, MOD_PARAMS
--       - MOD_INVENTORY  → fusionado en MOD_PRODUCTS
--       - MOD_PAYMENTS   → fusionado en MOD_INVOICING
--       - MOD_SUPPLIERS  → fusionado en MOD_PARAMS
--       - MOD_REPORTS    → fusionado en MOD_PARAMS
--       - MOD_AUDIT      → fusionado en MOD_PARAMS
--       - MOD_TAX        → fusionado en MOD_PARAMS
--   · Trigger updated_at y audit agregados a product_categories
-- =============================================
