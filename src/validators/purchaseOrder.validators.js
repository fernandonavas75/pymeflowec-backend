'use strict';

const { body } = require('express-validator');

const createRules = [
  body('supplier_id').isInt({ min: 1 }).withMessage('supplier_id es requerido.'),
  body('items').isArray({ min: 1 }).withMessage('Se requiere al menos un ítem.'),
  body('items.*.product_id').isInt({ min: 1 }).withMessage('product_id es requerido en cada ítem.'),
  body('items.*.quantity_ordered').isFloat({ min: 0.001 }).withMessage('quantity_ordered debe ser mayor a 0.'),
  body('items.*.unit_cost').isFloat({ min: 0 }).withMessage('unit_cost debe ser mayor o igual a 0.'),
  body('order_date').optional().isDate(),
  body('expected_date').optional().isDate(),
  body('notes').optional().trim(),
];

const receiveRules = [
  body('items').isArray({ min: 1 }).withMessage('Se requiere al menos un ítem.'),
  body('items.*.product_id').isInt({ min: 1 }),
  body('items.*.quantity_received').isFloat({ min: 0.001 }).withMessage('quantity_received debe ser mayor a 0.'),
];

module.exports = { createRules, receiveRules };
