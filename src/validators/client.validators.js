'use strict';

const { body } = require('express-validator');

const createRules = [
  body('full_name').trim().notEmpty().withMessage('El nombre completo es requerido.'),
  body('identification')
    .trim()
    .notEmpty().withMessage('La identificación es requerida.')
    .isLength({ min: 10, max: 13 }).withMessage('La identificación debe tener entre 10 y 13 caracteres.'),
  body('email').optional().isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Teléfono inválido.'),
  body('address').optional().trim(),
];

const updateRules = [
  body('full_name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío.'),
  body('identification')
    .optional()
    .trim()
    .isLength({ min: 10, max: 13 }).withMessage('La identificación debe tener entre 10 y 13 caracteres.'),
  body('email').optional().isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Teléfono inválido.'),
  body('address').optional().trim(),
];

module.exports = { createRules, updateRules };
