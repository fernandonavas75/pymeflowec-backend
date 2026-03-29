'use strict';

const { body } = require('express-validator');

const createRules = [
  body('name').trim().notEmpty().withMessage('El nombre del producto es requerido.'),
  body('unit_price')
    .isFloat({ min: 0.01 })
    .withMessage('El precio unitario debe ser mayor a 0.'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('El stock debe ser un entero mayor o igual a 0.'),
  body('category').optional().trim(),
  body('description').optional().trim(),
];

const updateRules = [
  body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío.'),
  body('unit_price').optional().isFloat({ min: 0.01 }).withMessage('El precio unitario debe ser mayor a 0.'),
  body('stock').optional().isInt({ min: 0 }).withMessage('El stock debe ser un entero mayor o igual a 0.'),
  body('category').optional().trim(),
  body('description').optional().trim(),
];

const updateStockRules = [
  body('stock')
    .notEmpty().withMessage('El campo stock es requerido.')
    .isInt({ min: 0 }).withMessage('El stock debe ser un entero mayor o igual a 0.'),
];

module.exports = { createRules, updateRules, updateStockRules };
