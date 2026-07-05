'use strict';

const controller   = require('../controllers/auth.controller');
const authenticate = require('../middlewares/authenticate');
const validate     = require('../middlewares/validate');
const { loginRules, refreshRules, registerRules, changePasswordRules, updateProfileRules } = require('../validators/auth.validators');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación y gestión de sesión
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Tokens de acceso y refresh
 *       401:
 *         description: Credenciales inválidas
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar nueva empresa y usuario administrador
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [company_name, ruc, email, password]
 *             properties:
 *               company_name: { type: string }
 *               ruc:          { type: string }
 *               email:        { type: string, format: email }
 *               password:     { type: string }
 *     responses:
 *       201:
 *         description: Empresa y usuario creados
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Renovar access token usando refresh token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refresh_token]
 *             properties:
 *               refresh_token: { type: string }
 *     responses:
 *       200:
 *         description: Nuevo access token
 *       401:
 *         description: Refresh token inválido o expirado
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Datos del usuario actual
 */

/**
 * @swagger
 * /auth/me:
 *   patch:
 *     summary: Actualizar el propio perfil (nombre, email; rol solo STORE_ADMIN)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name: { type: string }
 *               email:     { type: string, format: email }
 *               role_id:   { type: integer, description: "Solo STORE_ADMIN puede cambiar su rol" }
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *       403:
 *         description: Sin permisos para cambiar el rol
 *       409:
 *         description: Email ya registrado
 */

/**
 * @swagger
 * /auth/change-password:
 *   patch:
 *     summary: Cambiar contraseña del usuario autenticado
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [current_password, new_password]
 *             properties:
 *               current_password: { type: string }
 *               new_password:     { type: string }
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 */

module.exports = ({ loginLimiter, registerLimiter }) => {
  const router = require('express').Router();

  router.post('/login',    loginLimiter,    validate(loginRules),    controller.login);
  router.post('/register', registerLimiter, validate(registerRules), controller.register);
  router.post('/refresh',  validate(refreshRules),                controller.refresh);
  router.get('/me',        authenticate,                          controller.me);
  router.patch('/me',      authenticate, validate(updateProfileRules), controller.updateProfile);
  router.patch('/change-password',
    authenticate,
    validate(changePasswordRules),
    controller.changePassword
  );

  return router;
};
