'use strict';

const { body } = require('express-validator');

const createRules = [
  body('full_name').trim().notEmpty().withMessage('El nombre completo es requerido.'),
  body('email').isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres.'),
  body('role_id').isInt({ min: 1 }).withMessage('role_id debe ser un entero válido.'),
];

const updateRules = [
  body('full_name').optional().trim().notEmpty().withMessage('El nombre completo no puede estar vacío.'),
  body('email').optional().isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('role_id').optional().isInt({ min: 1 }).withMessage('role_id debe ser un entero válido.'),
];

const changePasswordRules = [
  body('current_password').notEmpty().withMessage('La contraseña actual es requerida.'),
  body('new_password')
    .isLength({ min: 8 })
    .withMessage('La nueva contraseña debe tener al menos 8 caracteres.'),
];

module.exports = { createRules, updateRules, changePasswordRules };
