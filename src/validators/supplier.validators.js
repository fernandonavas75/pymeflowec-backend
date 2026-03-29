'use strict';

const { body } = require('express-validator');

const createRules = [
  body('business_name').trim().notEmpty().withMessage('La razón social es requerida.'),
  body('contact_name').optional().trim(),
  body('email').optional().isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Teléfono inválido.'),
  body('address').optional().trim(),
];

const updateRules = [
  body('business_name').optional().trim().notEmpty().withMessage('La razón social no puede estar vacía.'),
  body('contact_name').optional().trim(),
  body('email').optional().isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Teléfono inválido.'),
  body('address').optional().trim(),
];

module.exports = { createRules, updateRules };
