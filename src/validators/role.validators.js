'use strict';

const { body } = require('express-validator');

const createRules = [
  body('name').trim().notEmpty().withMessage('El nombre del rol es requerido.'),
  body('description').optional().trim(),
  body('permission_ids').optional().isArray().withMessage('permission_ids debe ser un arreglo.'),
  body('permission_ids.*').optional().isInt({ min: 1 }),
];

const updateRules = [
  body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío.'),
  body('description').optional().trim(),
  body('permission_ids').optional().isArray(),
  body('permission_ids.*').optional().isInt({ min: 1 }),
];

module.exports = { createRules, updateRules };
