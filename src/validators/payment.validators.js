'use strict';

const { body } = require('express-validator');

const createRules = [
  body('invoice_id').isInt({ min: 1 }).withMessage('invoice_id es requerido.'),
  body('payment_method')
    .isIn(['cash', 'transfer', 'card', 'credit', 'other'])
    .withMessage('Método de pago inválido.'),
  body('amount').isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0.'),
  body('payment_date').optional().isDate(),
  body('reference_number').optional().trim(),
  body('cash_register_id').optional().isInt({ min: 1 }),
  body('notes').optional().trim(),
];

module.exports = { createRules };
