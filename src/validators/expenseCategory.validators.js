'use strict';

const { body } = require('express-validator');

const CATEGORY_TYPES = ['ADMINISTRATIVO','OPERATIVO','VENTAS','FINANCIERO','TRIBUTARIO','RECURSOS_HUMANOS','INVENTARIO','IMPREVISTO'];

const createRules = [
  body('name').trim().notEmpty().withMessage('El nombre es requerido.'),
  body('category_type').isIn(CATEGORY_TYPES).withMessage('Tipo de categoría inválido.'),
  body('description').optional({ nullable: true }).trim(),
];

const updateRules = [
  body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío.'),
  body('category_type').optional().isIn(CATEGORY_TYPES).withMessage('Tipo de categoría inválido.'),
  body('description').optional({ nullable: true }).trim(),
  body('is_active').optional().isBoolean(),
];

module.exports = { createRules, updateRules };
