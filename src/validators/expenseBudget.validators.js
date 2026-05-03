'use strict';

const { body } = require('express-validator');

const createRules = [
  body('category_id').isInt({ min: 1 }).withMessage('category_id es requerido.'),
  body('period_type').isIn(['MONTHLY','ANNUAL']).withMessage('period_type debe ser MONTHLY o ANNUAL.'),
  body('period_year').isInt({ min: 2020 }).withMessage('Año inválido.'),
  body('period_month').optional({ nullable: true }).isInt({ min: 1, max: 12 }).withMessage('Mes inválido (1-12).'),
  body('budgeted_amount').isFloat({ min: 0.01 }).withMessage('El monto presupuestado debe ser mayor a 0.'),
  body('notes').optional({ nullable: true }).trim(),
];

const updateRules = [
  body('budgeted_amount').optional().isFloat({ min: 0.01 }),
  body('notes').optional({ nullable: true }).trim(),
];

module.exports = { createRules, updateRules };
