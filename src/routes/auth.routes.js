'use strict';

const controller   = require('../controllers/auth.controller');
const authenticate = require('../middlewares/authenticate');
const validate     = require('../middlewares/validate');
const { loginRules, forgotPasswordRules, resetPasswordRules, refreshRules, registerRules } = require('../validators/auth.validators');

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
   * /auth/register:
   *   post:
   *     summary: Registrar nueva organización y administrador
   *     tags: [Auth]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [org_name, org_ruc, full_name, email, password]
   *             properties:
   *               org_name:  { type: string }
   *               org_ruc:   { type: string }
   *               org_email: { type: string }
   *               org_phone: { type: string }
   *               org_city:  { type: string }
   *               full_name: { type: string }
   *               email:     { type: string }
   *               password:  { type: string }
   *     responses:
   *       201:
   *         description: Organización y administrador creados, retorna tokens
   *       409:
   *         description: Email o RUC ya registrado
   */
  router.post('/register', validate(registerRules), controller.register);

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