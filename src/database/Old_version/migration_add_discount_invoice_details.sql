-- Migration: add discount column to invoice_details
-- F-07 fix: implement discount field that was documented but not stored
-- Run once against the existing database.

SET search_path TO erp;

ALTER TABLE invoice_details
  ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) NOT NULL DEFAULT 0
    CHECK (discount >= 0);

COMMENT ON COLUMN invoice_details.discount IS
  'Descuento total aplicado a la línea (sobre subtotal bruto). '
  'line_subtotal = unit_price * quantity - discount.';
