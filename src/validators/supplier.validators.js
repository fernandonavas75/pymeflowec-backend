'use strict';

const { body } = require('express-validator');

const createRules = [
  body('business_name').trim().notEmpty().withMessage('La razón social es requerida.'),
  body('ruc').optional({ checkFalsy: true }).trim().isLength({ min: 10 }).withMessage('El RUC debe tener al menos 10 caracteres.'),
  body('contact_name').optional().trim(),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('payment_terms').optional().trim(),
  body('notes').optional().trim(),
];

const updateRules = [
  body('business_name').optional().trim().notEmpty().withMessage('La razón social no puede estar vacía.'),
  body('ruc').optional({ checkFalsy: true }).trim().isLength({ min: 10 }),
  body('contact_name').optional().trim(),
  body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('payment_terms').optional().trim(),
  body('notes').optional().trim(),
];

module.exports = { createRules, updateRules };
