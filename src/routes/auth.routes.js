'use strict';

const controller   = require('../controllers/auth.controller');
const authenticate = require('../middlewares/authenticate');
const validate     = require('../middlewares/validate');
const { loginRules, forgotPasswordRules, resetPasswordRules, refreshRules } = require('../validators/auth.validators');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación y recuperación de contraseña
 */

module.exports = (loginLimiter, forgotPasswordLimiter) => {
  const router = require('express').Router();

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
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login exitoso
   *       401:
   *         description: Credenciales inválidas
   */
  router.post('/login', loginLimiter, validate(loginRules), controller.login);

  /**
   * @swagger
   * /auth/me:
   *   get:
   *     summary: Obtener usuario autenticado
   *     tags: [Auth]
   *     responses:
   *       200:
   *         description: Datos del usuario
   *       401:
   *         description: No autenticado
   */
  router.get('/me', authenticate, controller.me);

  /**
   * @swagger
   * /auth/forgot-password:
   *   post:
   *     summary: Solicitar recuperación de contraseña
   *     tags: [Auth]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email]
   *             properties:
   *               email:
   *                 type: string
   *     responses:
   *       200:
   *         description: Instrucciones enviadas
   */
  router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordRules), controller.forgotPassword);

  /**
   * @swagger
   * /auth/reset-password:
   *   post:
   *     summary: Restablecer contraseña con token
   *     tags: [Auth]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [token, password]
   *             properties:
   *               token:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Contraseña actualizada
   *       400:
   *         description: Token inválido o expirado
   */
  router.post('/reset-password', validate(resetPasswordRules), controller.resetPassword);

  /**
   * @swagger
   * /auth/refresh:
   *   post:
   *     summary: Renovar access token
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
   *               refresh_token:
   *                 type: string
   *     responses:
   *       200:
   *         description: Nuevo access token generado
   *       401:
   *         description: Refresh token inválido o expirado
   */
  router.post('/refresh', validate(refreshRules), controller.refresh);

  return router;
};