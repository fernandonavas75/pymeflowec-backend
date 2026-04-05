'use strict';

const { body } = require('express-validator');

const loginRules = [
  body('email').isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es requerida.'),
];

const forgotPasswordRules = [
  body('email').isEmail().withMessage('Email inválido.').normalizeEmail(),
];

const resetPasswordRules = [
  body('token').notEmpty().withMessage('El token es requerido.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres.'),
];

const refreshRules = [
  body('refresh_token').notEmpty().withMessage('El refresh_token es requerido.'),
];

const registerRules = [
  body('org_name').trim().notEmpty().withMessage('El nombre de la organización es requerido.'),
  body('org_ruc')
    .trim()
    .notEmpty().withMessage('El RUC es requerido.')
    .isLength({ min: 13, max: 13 }).withMessage('El RUC debe tener 13 dígitos.')
    .isNumeric().withMessage('El RUC debe contener solo dígitos.'),
  body('org_email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Email de la organización inválido.').normalizeEmail(),
  body('org_phone').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 20 }).withMessage('Teléfono inválido.'),
  body('org_city').optional({ nullable: true, checkFalsy: true }).trim(),
  body('full_name').trim().notEmpty().withMessage('El nombre del administrador es requerido.'),
  body('email').isEmail().withMessage('Email del administrador inválido.').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.'),
];

module.exports = { loginRules, forgotPasswordRules, resetPasswordRules, refreshRules, registerRules };
