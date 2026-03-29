'use strict';

const { body } = require('express-validator');

const createFromOrderRules = [
  body('order_id').isInt({ min: 1 }).withMessage('order_id debe ser un entero válido.'),
];

const createManualRules = [
  body('issue_date').isISO8601().withMessage('issue_date debe ser una fecha válida (ISO 8601).'),
  body('items').isArray({ min: 1 }).withMessage('La factura debe tener al menos un ítem.'),
  body('items.*.product_id')
    .isInt({ min: 1 })
    .withMessage('Cada ítem debe tener un product_id válido.'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('La cantidad de cada ítem debe ser al menos 1.'),
  body('items.*.unit_price')
    .isFloat({ min: 0.01 })
    .withMessage('El precio unitario debe ser mayor a 0.'),
];

module.exports = { createFromOrderRules, createManualRules };
