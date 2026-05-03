'use strict';

const { body } = require('express-validator');

const openRules = [
  body('opening_amount').isFloat({ min: 0.01 }).withMessage('El monto de apertura debe ser mayor a 0.'),
  body('name').optional().trim(),
  body('notes').optional({ nullable: true }).trim(),
];

const closeRules = [
  body('closing_amount_reported').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('El monto contado debe ser mayor o igual a 0.'),
  body('notes').optional({ nullable: true }).trim(),
];

const movementRules = [
  body('movement_type').isIn(['EXPENSE','REPLENISH','ADJUSTMENT']).withMessage('Tipo de movimiento inválido.'),
  body('amount').isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0.'),
  body('description').trim().notEmpty().withMessage('La descripción es requerida.'),
  body('category_id').optional({ nullable: true }).isInt({ min: 1 }),
  body('voucher_number').optional({ nullable: true }).trim(),
];

module.exports = { openRules, closeRules, movementRules };
