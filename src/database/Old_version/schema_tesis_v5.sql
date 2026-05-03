-- =============================================
-- PYMEFLOWEC · ERP MULTITENANT — SCHEMA v4 FINAL
-- PostgreSQL 15+
-- Integra: schema base v4 + forgot_password +
--          update_audit_trigger + update_module_requests +
--          update_expire
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
COMMENT ON COLUMN roles.scope IS 'PLATFORM = admin/soporte ERP | STORE = admin_tienda/vendedor';

-- =============================================
-- 2. COMPANIES (tenants)
-- =============================================
CREATE TABLE companies (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    business_name   VARCHAR(200),
    ruc             VARCHAR(13)  UNIQUE,
    email           VARCHAR(150),
    phone           VARCHAR(20),
    address         VARCHAR(255),
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE','INACTIVE','SUSPENDED','PENDING')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ  NULL,
    CONSTRAINT chk_companies_ruc_format
        CHECK (ruc IS NULL OR ruc ~ '^[0-9]{13}$')
);

COMMENT ON TABLE companies IS 'Cada fila es un tenant (tienda/negocio). deleted_at = soft-delete.';

-- =============================================
-- 3. USERS
-- company_id NULL  → usuario de plataforma
-- company_id NOT NULL → usuario de tienda
-- =============================================
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    company_id      BIGINT       NULL,
    role_id         BIGINT       NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   TEXT         NOT NULL,
    -- Recuperación de contraseña
    reset_token         TEXT         NULL,
    reset_token_expires TIMESTAMPTZ  NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE','INACTIVE','LOCKED')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ  NULL,
    CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_users_role    FOREIGN KEY (role_id)    REFERENCES roles(id)
);

COMMENT ON TABLE  users                        IS 'Usuarios del sistema. company_id NULL = personal de plataforma.';
COMMENT ON COLUMN users.reset_token            IS 'Token de un solo uso para recuperación de contraseña.';
COMMENT ON COLUMN users.reset_token_expires    IS 'Expiración del reset_token. NULL = no hay solicitud activa.';

-- =============================================
-- 4. MODULES
-- =============================================
CREATE TABLE modules (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(50)  NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    description     VARCHAR(255),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE modules IS 'Catálogo de módulos disponibles en la plataforma.';

-- =============================================
-- 5. COMPANY MODULE REQUESTS
-- Incluye: expires_at (aprobación temporal) y
--          status REVOKED
-- =============================================
CREATE TABLE company_module_requests (
    id              BIGSERIAL PRIMARY KEY,
    company_id      BIGINT       NOT NULL,
    module_id       BIGINT       NOT NULL,
    requested_by    BIGINT       NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING','APPROVED','REJECTED','REVOKED')),
    reviewed_by     BIGINT       NULL,
    reviewed_at     TIMESTAMPTZ  NULL,
    expires_at      TIMESTAMPTZ  NULL,
    comments        TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_cmr_company      FOREIGN KEY (company_id)   REFERENCES companies(id),
    CONSTRAINT fk_cmr_module       FOREIGN KEY (module_id)    REFERENCES modules(id),
    CONSTRAINT fk_cmr_requested_by FOREIGN KEY (requested_by) REFERENCES users(id),
    CONSTRAINT fk_cmr_reviewed_by  FOREIGN KEY (reviewed_by)  REFERENCES users(id)
);

COMMENT ON COLUMN company_module_requests.expires_at IS 'Fecha de expiración de una aprobación temporal. NULL = sin límite.';
COMMENT ON COLUMN company_module_requests.status     IS 'PENDING → APPROVED / REJECTED / REVOKED.';

CREATE UNIQUE INDEX uq_cmr_pending
    ON company_module_requests(company_id, module_id)
    WHERE status = 'PENDING';

-- =============================================
-- 6. COMPANY MODULES
-- Incluye: expires_at para acceso temporal
-- =============================================
CREATE TABLE company_modules (
    id              BIGSERIAL PRIMARY KEY,
    company_id      BIGINT       NOT NULL,
    module_id       BIGINT       NOT NULL,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    approved_by     BIGINT       NULL,
    approved_at     TIMESTAMPTZ  NULL,
    expires_at      TIMESTAMPTZ  NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
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
    id              BIGSERIAL PRIMARY KEY,
    company_id      BIGINT       NOT NULL,
    name            VARCHAR(150) NOT NULL,
    ruc             VARCHAR(13),
    phone           VARCHAR(20),
    email           VARCHAR(150),
    address         VARCHAR(255),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ  NULL,
    CONSTRAINT fk_suppliers_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT chk_suppliers_ruc    CHECK (ruc IS NULL OR ruc ~ '^[0-9]{13}$'),
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
        (customer_type = 'CEDULA'         AND document_number ~ '^[0-9]{10}$')
        OR (customer_type = 'RUC'         AND document_number ~ '^[0-9]{13}$')
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
    id              BIGSERIAL PRIMARY KEY,
    company_id      BIGINT       NOT NULL,
    tax_name        VARCHAR(100) NOT NULL,
    percentage      NUMERIC(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    valid_from      DATE         NOT NULL DEFAULT CURRENT_DATE,
    valid_to        DATE         NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_tr_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT chk_tr_dates  CHECK (valid_to IS NULL OR valid_to >= valid_from),
    CONSTRAINT uq_tax_rates_id_company UNIQUE (id, company_id)
);

COMMENT ON TABLE tax_rates IS 'IVA u otros impuestos. El admin de tienda puede modificar el porcentaje vigente.';

-- =============================================
-- 10. PRODUCTS
-- =============================================
CREATE TABLE products (
    id              BIGSERIAL PRIMARY KEY,
    company_id      BIGINT        NOT NULL,
    supplier_id     BIGINT        NULL,
    sku             VARCHAR(50),
    name            VARCHAR(150)  NOT NULL,
    description     TEXT,
    purchase_price  NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (purchase_price >= 0),
    sale_price      NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
    stock           INTEGER       NOT NULL DEFAULT 0 CHECK (stock >= 0),
    min_stock       INTEGER       NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
    tax_rate_id     BIGINT        NULL,
    status          VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ   NULL,
    CONSTRAINT fk_prod_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_products_supplier_company
        FOREIGN KEY (supplier_id, company_id)
        REFERENCES suppliers(id, company_id),
    CONSTRAINT fk_products_tax_rate_company
        FOREIGN KEY (tax_rate_id, company_id)
        REFERENCES tax_rates(id, company_id),
    CONSTRAINT uq_products_id_company UNIQUE (id, company_id)
);

CREATE UNIQUE INDEX uq_prod_company_sku
    ON products(company_id, sku)
    WHERE sku IS NOT NULL AND deleted_at IS NULL;

COMMENT ON COLUMN products.tax_rate_id IS 'Tasa de impuesto por defecto del producto. NULL = sin impuesto o se asigna al facturar.';

-- =============================================
-- 11. INVOICES
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
    created_by      BIGINT        NOT NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ   NULL,
    CONSTRAINT fk_inv_company    FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_invoices_customer_company
        FOREIGN KEY (customer_id, company_id)
        REFERENCES store_customers(id, company_id),
    CONSTRAINT fk_inv_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT uq_inv_number     UNIQUE (company_id, invoice_number),
    CONSTRAINT uq_invoices_id_company UNIQUE (id, company_id)
);

-- =============================================
-- 12. INVOICE DETAILS
-- =============================================
CREATE TABLE invoice_details (
    id              BIGSERIAL PRIMARY KEY,
    invoice_id      BIGINT        NOT NULL,
    company_id      BIGINT        NOT NULL,
    product_id      BIGINT        NULL,
    tax_rate_id     BIGINT        NULL,
    product_name    VARCHAR(150)  NOT NULL,
    description     TEXT,
    quantity        INTEGER       NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    tax_percentage  NUMERIC(5,2)  NOT NULL DEFAULT 0
                    CHECK (tax_percentage >= 0 AND tax_percentage <= 100),
    tax_amount      NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    line_subtotal   NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (line_subtotal >= 0),
    line_total      NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (line_total >= 0),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_invd_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_invoice_details_invoice_company
        FOREIGN KEY (invoice_id, company_id)
        REFERENCES invoices(id, company_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_invoice_details_product_company
        FOREIGN KEY (product_id, company_id)
        REFERENCES products(id, company_id),
    CONSTRAINT fk_invoice_details_tax_rate_company
        FOREIGN KEY (tax_rate_id, company_id)
        REFERENCES tax_rates(id, company_id)
);

COMMENT ON COLUMN invoice_details.company_id  IS 'Denormalizado para RLS directo sin JOIN a invoices.';
COMMENT ON COLUMN invoice_details.tax_rate_id IS 'Referencia a la tasa aplicada. tax_percentage guarda el % snapshot.';

-- =============================================
-- 13. INVENTORY MOVEMENTS
-- =============================================
CREATE TABLE inventory_movements (
    id              BIGSERIAL PRIMARY KEY,
    company_id      BIGINT       NOT NULL,
    product_id      BIGINT       NOT NULL,
    movement_type   VARCHAR(20)  NOT NULL
                    CHECK (movement_type IN ('IN','OUT','ADJUSTMENT')),
    quantity        INTEGER      NOT NULL CHECK (quantity > 0),
    reference_type  VARCHAR(20)  NOT NULL
                    CHECK (reference_type IN ('PURCHASE','SALE','MANUAL')),
    reference_id    BIGINT       NULL,
    notes           TEXT,
    created_by      BIGINT       NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_im_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_inventory_movements_product_company
        FOREIGN KEY (product_id, company_id)
        REFERENCES products(id, company_id),
    CONSTRAINT fk_im_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- =============================================
-- 14. AUDIT LOGS
-- ip_address y user_agent los rellena Node.js
-- desde authenticate.js en res.on('finish').
-- =============================================
CREATE TABLE audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    company_id      BIGINT       NULL,
    user_id         BIGINT       NULL,
    action          VARCHAR(50)  NOT NULL,
    table_name      VARCHAR(100) NOT NULL,
    record_id       BIGINT       NULL,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_al_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_al_user    FOREIGN KEY (user_id)    REFERENCES users(id)
);

COMMENT ON TABLE audit_logs IS 'Registro de cada INSERT/UPDATE/DELETE. ip_address y user_agent capturados desde el middleware de autenticación.';

-- =============================================
-- 15. SYSTEM LOGS
-- =============================================
CREATE TABLE system_logs (
    id              BIGSERIAL PRIMARY KEY,
    company_id      BIGINT       NULL,
    user_id         BIGINT       NULL,
    level           VARCHAR(10)  NOT NULL
                    CHECK (level IN ('DEBUG','INFO','WARN','ERROR','FATAL')),
    source          VARCHAR(50)  NOT NULL
                    CHECK (source IN ('BACKEND','DATABASE','AUTH','API','CRON')),
    message         TEXT         NOT NULL,
    details         JSONB,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_sl_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_sl_user    FOREIGN KEY (user_id)    REFERENCES users(id)
);

COMMENT ON TABLE system_logs IS 'Logs técnicos. Soporte ERP los consulta para diagnosticar fallos.';

-- =============================================
-- ÍNDICES OPERATIVOS
-- =============================================
CREATE INDEX idx_users_company   ON users(company_id)   WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role      ON users(role_id);
CREATE INDEX idx_users_status    ON users(status)        WHERE deleted_at IS NULL;

CREATE INDEX idx_prod_company    ON products(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_prod_supplier   ON products(supplier_id);
CREATE INDEX idx_prod_status     ON products(status)     WHERE deleted_at IS NULL;
CREATE INDEX idx_prod_low_stock  ON products(company_id, stock)
    WHERE status = 'ACTIVE' AND deleted_at IS NULL;

CREATE INDEX idx_supp_company    ON suppliers(company_id)       WHERE deleted_at IS NULL;
CREATE INDEX idx_sc_company      ON store_customers(company_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_inv_company     ON invoices(company_id)        WHERE deleted_at IS NULL;
CREATE INDEX idx_inv_customer    ON invoices(customer_id);
CREATE INDEX idx_inv_created_by  ON invoices(created_by);
CREATE INDEX idx_inv_issue_date  ON invoices(issue_date);
CREATE INDEX idx_inv_status      ON invoices(company_id, status) WHERE deleted_at IS NULL;

CREATE INDEX idx_invd_invoice    ON invoice_details(invoice_id);
CREATE INDEX idx_invd_product    ON invoice_details(product_id);
CREATE INDEX idx_invd_company    ON invoice_details(company_id);

CREATE INDEX idx_im_company      ON inventory_movements(company_id);
CREATE INDEX idx_im_product      ON inventory_movements(product_id);
CREATE INDEX idx_im_created_at   ON inventory_movements(created_at);

CREATE INDEX idx_al_company      ON audit_logs(company_id);
CREATE INDEX idx_al_user         ON audit_logs(user_id);
CREATE INDEX idx_al_table        ON audit_logs(table_name);
CREATE INDEX idx_al_created_at   ON audit_logs(created_at);

CREATE INDEX idx_sl_company      ON system_logs(company_id);
CREATE INDEX idx_sl_level        ON system_logs(level);
CREATE INDEX idx_sl_created_at   ON system_logs(created_at);

-- Índice parcial para detección eficiente de módulos vencidos (cron)
CREATE INDEX idx_cm_expiry
    ON company_modules(expires_at)
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
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'roles','companies','users','modules',
        'company_module_requests','company_modules',
        'suppliers','store_customers','tax_rates',
        'products','invoices'
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
DECLARE
    v_scope VARCHAR(20);
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
FOR EACH ROW
EXECUTE FUNCTION erp.fn_validate_user_role_scope();

-- =============================================
-- FUNCIÓN: auditoría automática — v4
-- ip_address y user_agent quedan NULL en el
-- INSERT; Node.js los actualiza después via
-- UPDATE en res.on('finish') en authenticate.js.
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
        v_action := 'INSERT';
        v_new    := to_jsonb(NEW);
        v_row    := v_new;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        v_old    := to_jsonb(OLD);
        v_new    := to_jsonb(NEW);
        v_row    := v_new;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_old    := to_jsonb(OLD);
        v_row    := v_old;
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
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'companies','users','suppliers','store_customers',
        'products','invoices','invoice_details',
        'inventory_movements','tax_rates',
        'company_modules','company_module_requests'
    ]) LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_audit_%s
             AFTER INSERT OR UPDATE OR DELETE ON erp.%I
             FOR EACH ROW EXECUTE FUNCTION erp.fn_audit_trigger();',
            t, t
        );
    END LOOP;
END $$;
