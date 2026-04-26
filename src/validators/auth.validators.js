'use strict';

const { body } = require('express-validator');

const loginRules = [
  body('email').isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es requerida.'),
];

const refreshRules = [
  body('refresh_token').notEmpty().withMessage('El refresh_token es requerido.'),
];

const registerRules = [
  body('company_name').trim().notEmpty().withMessage('El nombre de la empresa es requerido.'),
  body('company_ruc')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 13, max: 13 }).withMessage('El RUC debe tener 13 dígitos.')
    .isNumeric().withMessage('El RUC debe contener solo dígitos.'),
  body('company_email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('company_phone').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 20 }),
  body('full_name').trim().notEmpty().withMessage('El nombre del administrador es requerido.'),
  body('email').isEmail().withMessage('Email del administrador inválido.').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.'),
  body('module_ids')
    .optional({ nullable: true })
    .isArray().withMessage('module_ids debe ser un arreglo.')
    .custom((arr) => arr.every((v) => { const n = Number(v); return Number.isInteger(n) && n > 0; }))
    .withMessage('Cada module_id debe ser un entero positivo.'),
];

const changePasswordRules = [
  body('current_password').notEmpty().withMessage('La contraseña actual es requerida.'),
  body('new_password').isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres.'),
];

module.exports = { loginRules, refreshRules, registerRules, changePasswordRules };
