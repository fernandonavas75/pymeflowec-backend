'use strict';

const { body } = require('express-validator');

const openRules = [
  body('opening_amount').optional().isFloat({ min: 0 }).withMessage('El monto de apertura debe ser mayor o igual a 0.'),
];

const closeRules = [
  body('actual_amount').isFloat({ min: 0 }).withMessage('El monto contado es requerido.'),
  body('notes').optional().trim(),
];

const movementRules = [
  body('movement_type')
    .isIn(['withdrawal', 'deposit'])
    .withMessage('Solo se permiten retiros o depósitos manuales.'),
  body('amount').isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0.'),
  body('description').optional().trim(),
];

module.exports = { openRules, closeRules, movementRules };
