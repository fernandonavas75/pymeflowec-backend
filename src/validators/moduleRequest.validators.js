'use strict';

const { body, query } = require('express-validator');

const createRequest = [
  body('module_id')
    .isInt({ min: 1 }).withMessage('module_id debe ser un entero positivo.'),
  body('notes')
    .optional().isString().trim().isLength({ max: 500 })
    .withMessage('Notas demasiado largas.'),
];

const reviewStatus = [
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'cancelled'])
    .withMessage('Status inválido.'),
];

const rejectRequest = [
  body('reason')
    .optional().isString().trim().isLength({ max: 500 })
    .withMessage('Razón demasiado larga.'),
];

module.exports = { createRequest, reviewStatus, rejectRequest };
