-- =============================================
-- MIGRACIÓN: Añadir invoice_settings a companies
-- Aplicar sobre schema v8 para obtener v9
-- =============================================

SET search_path TO erp;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS invoice_settings JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN companies.invoice_settings IS
  'Configuración de personalización de facturas por tenant. '
  'Campos: display_name (VARCHAR), template_id (classic|modern|minimal), '
  'accent_color (hex #rrggbb), footer_text (VARCHAR), '
  'establishment (VARCHAR 3 dígitos, default 001 — establecimiento SRI), '
  'emission_point (VARCHAR 3 dígitos, default 001 — punto de emisión SRI).';
