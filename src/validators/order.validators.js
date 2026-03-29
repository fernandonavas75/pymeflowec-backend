'use strict';

const { body } = require('express-validator');

const createRules = [
  body('client_id').isInt({ min: 1 }).withMessage('client_id debe ser un entero válido.'),
  body('order_date').optional().isISO8601().withMessage('order_date debe ser una fecha válida (ISO 8601).'),
  body('items').isArray({ min: 1 }).withMessage('La orden debe tener al menos un ítem.'),
  body('items.*.product_id')
    .isInt({ min: 1 })
    .withMessage('Cada ítem debe tener un product_id válido.'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('La cantidad de cada ítem debe ser al menos 1.'),
];

module.exports = { createRules };
