'use strict';

const { body } = require('express-validator');

const createRules = [
  body('invoice_id').isInt({ min: 1 }).withMessage('invoice_id es requerido.'),
  body('reason').trim().notEmpty().withMessage('El motivo de la nota de crédito es requerido.'),
  body('items').isArray({ min: 1 }).withMessage('Se requiere al menos un ítem.'),
  body('items.*.product_id').isInt({ min: 1 }),
  body('items.*.quantity').isFloat({ min: 0.001 }),
  body('items.*.unit_price').optional().isFloat({ min: 0 }),
];

module.exports = { createRules };
