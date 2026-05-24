'use strict';

const { body } = require('express-validator');

const createRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre de la categoría es requerido.')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.'),
  body('description').optional().trim(),
];

const updateRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('El nombre no puede estar vacío.')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.'),
  body('description').optional().trim(),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Estado inválido.'),
];

module.exports = { createRules, updateRules };
