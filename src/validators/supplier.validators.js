'use strict';

const { body } = require('express-validator');
const { validateCedula, validateRuc } = require('../utils/ecuadorId');

// Valida cédula (10 dígitos) o RUC (13 dígitos) ecuatorianos
const rucRule = (field) =>
  field
    .optional({ checkFalsy: true }).trim()
    .custom((value) => {
      if (value.length === 10) {
        if (!validateCedula(value)) throw new Error('La cédula ingresada no es válida.');
      } else if (value.length === 13) {
        if (!validateRuc(value)) throw new Error('El RUC ingresado no es válido.');
      } else {
        throw new Error('El RUC debe tener 10 (cédula) o 13 (RUC) dígitos.');
      }
      return true;
    });

const createRules = [
  body('name').trim().notEmpty().withMessage('El nombre es requerido.')
    .isLength({ min: 2, max: 150 }).withMessage('El nombre debe tener entre 2 y 150 caracteres.'),
  rucRule(body('ruc')),
  body('email').optional({ checkFalsy: true }).trim()
    .isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).trim()
    .isLength({ max: 20 }).withMessage('El teléfono no puede exceder 20 caracteres.'),
  body('address').optional({ checkFalsy: true }).trim()
    .isLength({ max: 255 }).withMessage('La dirección no puede exceder 255 caracteres.'),
];

const updateRules = [
  body('name').optional().trim()
    .notEmpty().withMessage('El nombre no puede estar vacío.')
    .isLength({ min: 2, max: 150 }).withMessage('El nombre debe tener entre 2 y 150 caracteres.'),
  rucRule(body('ruc')),
  body('email').optional({ checkFalsy: true }).trim()
    .isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).trim()
    .isLength({ max: 20 }).withMessage('El teléfono no puede exceder 20 caracteres.'),
  body('address').optional({ checkFalsy: true }).trim()
    .isLength({ max: 255 }).withMessage('La dirección no puede exceder 255 caracteres.'),
];

module.exports = { createRules, updateRules };
