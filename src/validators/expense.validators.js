'use strict';

const { body } = require('express-validator');

const createRules = [
  body('category_id').isInt({ min: 1 }).withMessage('category_id es requerido.'),
  body('amount').isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0.'),
  body('payment_method')
    .optional()
    .isIn(['cash', 'transfer', 'card', 'other'])
    .withMessage('Método de pago inválido.'),
  body('expense_date').optional().isDate(),
  body('supplier_id').optional({ nullable: true }).isInt({ min: 1 }),
  body('reference_number').optional().trim(),
  body('description').optional().trim(),
  body('is_recurring').optional().isBoolean(),
  body('recurrence_day').optional({ nullable: true }).isInt({ min: 1, max: 31 }),
];

const createCategoryRules = [
  body('name').trim().notEmpty().withMessage('El nombre de la categoría es requerido.'),
  body('description').optional().trim(),
];

module.exports = { createRules, createCategoryRules };
