'use strict';

const { body } = require('express-validator');

const createRules = [
  body('full_name').trim().notEmpty().withMessage('El nombre completo es requerido.'),
  body('identification')
    .trim().notEmpty().withMessage('La identificación es requerida.')
    .isLength({ min: 10 }).withMessage('La identificación debe tener al menos 10 caracteres.'),
  body('identification_type')
    .optional().isIn(['cedula', 'ruc', 'pasaporte']).withMessage('Tipo de identificación inválido.'),
  body('client_type')
    .optional().isIn(['individual', 'business']).withMessage('Tipo de cliente inválido.'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
];

const updateRules = [
  body('full_name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío.'),
  body('identification').optional().trim().isLength({ min: 10 }),
  body('identification_type').optional().isIn(['cedula', 'ruc', 'pasaporte']),
  body('client_type').optional().isIn(['individual', 'business']),
  body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
];

module.exports = { createRules, updateRules };
