'use strict';

const { body } = require('express-validator');

const assign = [
  body('user_id')
    .isInt({ min: 1 }).withMessage('user_id debe ser un entero positivo.'),
  body('platform_role_id')
    .isInt({ min: 1 }).withMessage('platform_role_id debe ser un entero positivo.'),
  body('notes')
    .optional().isString().trim().isLength({ max: 500 })
    .withMessage('Notas demasiado largas.'),
];

module.exports = { assign };
