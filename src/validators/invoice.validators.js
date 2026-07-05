'use strict';

const { body } = require('express-validator');

const createRules = [
  body('customer_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('customer_id debe ser un entero positivo.'),
  body('items')
    .isArray({ min: 1 }).withMessage('La factura debe tener al menos un ítem.'),
  body('items.*.product_id')
    .isInt({ min: 1 }).withMessage('Cada ítem debe tener un product_id válido.'),
  body('items.*.quantity')
    .isInt({ min: 1 }).withMessage('La cantidad de cada ítem debe ser un entero mayor o igual a 1.'),
  // unit_price se acepta por compatibilidad pero el service usa siempre el sale_price del producto
  body('items.*.unit_price')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('El precio unitario debe ser un número mayor o igual a 0.'),
  body('items.*.discount')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('El descuento por línea debe ser un valor mayor o igual a 0.'),
  body('items.*.tax_rate_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('tax_rate_id debe ser un entero positivo.'),
  body('notes').optional().trim(),
];

module.exports = { createRules };
