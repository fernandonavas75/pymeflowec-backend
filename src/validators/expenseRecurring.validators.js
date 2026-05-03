'use strict';

const { body } = require('express-validator');

const VOUCHER_TYPES    = ['FACTURA','NOTA_VENTA','RECIBO','LIQUIDACION','SIN_COMPROBANTE','OTRO'];
const PAYMENT_METHODS  = ['EFECTIVO','TRANSFERENCIA','TARJETA_DEBITO','TARJETA_CREDITO','CHEQUE','OTRO'];

const createRules = [
  body('category_id').isInt({ min: 1 }).withMessage('category_id es requerido.'),
  body('description').trim().notEmpty().withMessage('La descripción es requerida.'),
  body('amount').isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0.'),
  body('day_of_month').isInt({ min: 1, max: 28 }).withMessage('day_of_month debe estar entre 1 y 28.'),
  body('supplier_id').optional({ nullable: true }).isInt({ min: 1 }),
  body('supplier_name_free').optional({ nullable: true }).trim(),
  body('voucher_type').optional({ nullable: true }).isIn(VOUCHER_TYPES),
  body('default_payment_method').optional({ nullable: true }).isIn(PAYMENT_METHODS),
  body('starts_at').optional().isDate(),
  body('ends_at').optional({ nullable: true }).isDate(),
];

const updateRules = [
  body('category_id').optional().isInt({ min: 1 }),
  body('description').optional().trim().notEmpty(),
  body('amount').optional().isFloat({ min: 0.01 }),
  body('day_of_month').optional().isInt({ min: 1, max: 28 }),
  body('supplier_id').optional({ nullable: true }).isInt({ min: 1 }),
  body('supplier_name_free').optional({ nullable: true }).trim(),
  body('voucher_type').optional({ nullable: true }).isIn(VOUCHER_TYPES),
  body('default_payment_method').optional({ nullable: true }).isIn(PAYMENT_METHODS),
  body('starts_at').optional().isDate(),
  body('ends_at').optional({ nullable: true }).isDate(),
  body('is_active').optional().isBoolean(),
];

module.exports = { createRules, updateRules };
