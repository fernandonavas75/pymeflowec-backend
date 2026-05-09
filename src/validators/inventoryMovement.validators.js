'use strict';

const { body } = require('express-validator');

const createRules = [
  body('product_id').isInt({ min: 1 }).withMessage('product_id es requerido.'),
  body('movement_type').isIn(['IN','OUT','ADJUSTMENT']).withMessage('Tipo de movimiento inválido.'),
  body('quantity').isInt({ min: 1 }).withMessage('La cantidad debe ser mayor a 0.'),
  body('reference_type').optional().isIn(['PURCHASE','SALE','MANUAL']).withMessage('reference_type debe ser PURCHASE, SALE o MANUAL.'),
  body('notes').optional({ nullable: true }).trim(),
];

module.exports = { createRules };
