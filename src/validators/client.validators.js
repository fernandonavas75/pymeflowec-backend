'use strict';

const { body } = require('express-validator');
const { validateCedula, validateRuc } = require('../utils/ecuadorId');

const createRules = [
  body('full_name').trim().notEmpty().withMessage('El nombre completo es requerido.'),
  body('identification_type')
    .optional().isIn(['cedula', 'ruc', 'pasaporte']).withMessage('Tipo de identificación inválido.'),
  body('identification')
    .trim().notEmpty().withMessage('La identificación es requerida.')
    .isLength({ min: 10 }).withMessage('La identificación debe tener al menos 10 caracteres.')
    .custom((value, { req }) => {
      const type = req.body.identification_type;
      const isAllDigits = /^\d+$/.test(value);

      if (type === 'pasaporte') return true;

      if (type === 'cedula' || (!type && value.length === 10 && isAllDigits)) {
        if (!validateCedula(value)) throw new Error('Los datos ingresados no son correctos.');
      } else if (type === 'ruc' || (!type && value.length === 13 && isAllDigits)) {
        if (!validateRuc(value)) throw new Error('Los datos ingresados no son correctos.');
      }

      return true;
    }),
  body('client_type')
    .optional().isIn(['individual', 'business']).withMessage('Tipo de cliente inválido.'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
];

const updateRules = [
  body('full_name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío.'),
  body('identification_type').optional().isIn(['cedula', 'ruc', 'pasaporte']),
  body('identification')
    .optional().trim().isLength({ min: 10 })
    .custom((value, { req }) => {
      if (!value) return true;
      const type = req.body.identification_type;
      const isAllDigits = /^\d+$/.test(value);

      if (type === 'pasaporte') return true;

      if (type === 'cedula' || (!type && value.length === 10 && isAllDigits)) {
        if (!validateCedula(value)) throw new Error('Los datos ingresados no son correctos.');
      } else if (type === 'ruc' || (!type && value.length === 13 && isAllDigits)) {
        if (!validateRuc(value)) throw new Error('Los datos ingresados no son correctos.');
      }

      return true;
    }),
  body('client_type').optional().isIn(['individual', 'business']),
  body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
];

module.exports = { createRules, updateRules };
