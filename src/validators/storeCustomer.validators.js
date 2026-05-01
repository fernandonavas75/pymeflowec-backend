'use strict';

const { body } = require('express-validator');
const { validateCedula, validateRuc } = require('../utils/ecuadorId');

const documentRule = (required = true) => {
  const chain = body('document_number').trim();

  const base = required
    ? chain.notEmpty().withMessage('El número de documento es requerido.')
    : chain.optional();

  return base.custom((value, { req }) => {
    if (!value) return true;
    const type = req.body.customer_type;

    if (type === 'FINAL_CONSUMER') return true;

    if (type === 'CEDULA') {
      if (!validateCedula(value)) throw new Error('Cédula ecuatoriana inválida.');
    } else if (type === 'RUC') {
      if (!validateRuc(value)) throw new Error('RUC ecuatoriano inválido.');
    } else {
      // Sin tipo explícito: inferir por longitud
      if (value.length === 10 && /^\d{10}$/.test(value)) {
        if (!validateCedula(value)) throw new Error('Cédula ecuatoriana inválida.');
      } else if (value.length === 13 && /^\d{13}$/.test(value)) {
        if (!validateRuc(value)) throw new Error('RUC ecuatoriano inválido.');
      }
    }
    return true;
  });
};

const createRules = [
  body('customer_type')
    .notEmpty().withMessage('El tipo de cliente es requerido.')
    .isIn(['CEDULA', 'RUC', 'FINAL_CONSUMER']).withMessage('Tipo de cliente inválido.'),
  documentRule(true),
  body('full_name').trim().notEmpty().withMessage('El nombre completo es requerido.'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
];

const updateRules = [
  body('customer_type')
    .optional()
    .isIn(['CEDULA', 'RUC', 'FINAL_CONSUMER']).withMessage('Tipo de cliente inválido.'),
  documentRule(false),
  body('full_name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío.'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
];

module.exports = { createRules, updateRules };
