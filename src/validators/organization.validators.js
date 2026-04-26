'use strict';

const { body } = require('express-validator');
const { validateRuc } = require('../utils/ecuadorId');

const createRules = [
  body('name').trim().notEmpty().withMessage('El nombre de la organización es requerido.'),
  body('ruc')
    .trim()
    .notEmpty().withMessage('El RUC es requerido.')
    .isLength({ min: 13, max: 13 }).withMessage('El RUC debe tener 13 dígitos.')
    .isNumeric().withMessage('El RUC debe contener solo dígitos.')
    .custom((value) => {
      if (!validateRuc(value)) throw new Error('Los datos ingresados no son correctos.');
      return true;
    }),
  body('email').isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Teléfono inválido.'),
  body('address').optional().trim(),
];

const updateRules = [
  body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío.'),
  body('email').optional().isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Teléfono inválido.'),
  body('address').optional().trim(),
  body('tax_rate')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('tax_rate debe ser un decimal entre 0 y 1 (ej: 0.12 para 12%).'),
];

module.exports = { createRules, updateRules };
