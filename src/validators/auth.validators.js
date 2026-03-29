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

module.exports = { loginRules, forgotPasswordRules, resetPasswordRules, refreshRules };
