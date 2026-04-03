'use strict';

const { body } = require('express-validator');

const createRules = [
  body('name').trim().notEmpty().withMessage('El nombre de la categoría es requerido.'),
  body('parent_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('parent_id debe ser un entero positivo.'),
  body('sort_order').optional().isInt({ min: 0 }),
];

const updateRules = [
  body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío.'),
  body('parent_id').optional({ nullable: true }).isInt({ min: 1 }),
  body('sort_order').optional().isInt({ min: 0 }),
  body('is_active').optional().isBoolean(),
];

module.exports = { createRules, updateRules };
