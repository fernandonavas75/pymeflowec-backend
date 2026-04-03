'use strict';

const { body } = require('express-validator');

const UNITS = ['unidad', 'kg', 'lb', 'litro', 'metro', 'paquete', 'caja', 'docena', 'funda'];

const createRules = [
  body('name').trim().notEmpty().withMessage('El nombre del producto es requerido.'),
  body('unit_price').isFloat({ min: 0 }).withMessage('El precio unitario debe ser mayor o igual a 0.'),
  body('cost_price').optional().isFloat({ min: 0 }),
  body('stock').optional().isFloat({ min: 0 }).withMessage('El stock debe ser mayor o igual a 0.'),
  body('min_stock').optional().isFloat({ min: 0 }),
  body('unit').optional().isIn(UNITS).withMessage(`Unidad inválida. Valores: ${UNITS.join(', ')}`),
  body('category_id').optional({ nullable: true }).isInt({ min: 1 }),
  body('tax_rate_id').optional({ nullable: true }).isInt({ min: 1 }),
  body('barcode').optional().trim(),
  body('sku').optional().trim(),
  body('description').optional().trim(),
];

const updateRules = [
  body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío.'),
  body('unit_price').optional().isFloat({ min: 0 }),
  body('cost_price').optional().isFloat({ min: 0 }),
  body('min_stock').optional().isFloat({ min: 0 }),
  body('unit').optional().isIn(UNITS),
  body('category_id').optional({ nullable: true }).isInt({ min: 1 }),
  body('tax_rate_id').optional({ nullable: true }).isInt({ min: 1 }),
  body('barcode').optional().trim(),
  body('sku').optional().trim(),
  body('description').optional().trim(),
];

const adjustStockRules = [
  body('quantity').isFloat().withMessage('La cantidad es requerida.'),
  body('movement_type')
    .isIn(['in', 'out', 'adjustment'])
    .withMessage('Tipo de movimiento inválido: in, out, adjustment.'),
  body('reason').optional().trim(),
];

module.exports = { createRules, updateRules, adjustStockRules };
