'use strict';

const controller           = require('../controllers/user.controller');
const authenticate         = require('../middlewares/authenticate');
const authorize            = require('../middlewares/authorize');
const platformStoreAccess  = require('../middlewares/platformStoreAccess');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios de la tienda
 */

/**
 * @swagger
 * /users/forgot-password:
 *   post:
 *     summary: Solicitar restablecimiento de contraseña
 *     tags: [Users]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Correo de restablecimiento enviado
 */

/**
 * @swagger
 * /users/reset-password:
 *   post:
 *     summary: Restablecer contraseña con token
 *     tags: [Users]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, new_password]
 *             properties:
 *               token:        { type: string }
 *               new_password: { type: string }
 *     responses:
 *       200:
 *         description: Contraseña restablecida
 *       400:
 *         description: Token inválido o expirado
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Listar usuarios de la tienda (STORE_ADMIN)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *   post:
 *     summary: Crear usuario (STORE_ADMIN o PLATFORM_ADMIN)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role_id]
 *             properties:
 *               name:       { type: string }
 *               email:      { type: string, format: email }
 *               password:   { type: string }
 *               role_id:    { type: integer }
 *               company_id: { type: integer, description: "Solo PLATFORM_ADMIN" }
 *     responses:
 *       201:
 *         description: Usuario creado
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Obtener usuario por ID (STORE_ADMIN)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Datos del usuario
 *       404:
 *         description: No encontrado
 *   put:
 *     summary: Actualizar usuario (STORE_ADMIN)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:    { type: string }
 *               email:   { type: string, format: email }
 *               role_id: { type: integer }
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *   delete:
 *     summary: Eliminar usuario (STORE_ADMIN)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Usuario eliminado
 */

/**
 * @swagger
 * /users/{id}/activate:
 *   patch:
 *     summary: Activar usuario (STORE_ADMIN)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Usuario activado
 */

/**
 * @swagger
 * /users/{id}/deactivate:
 *   patch:
 *     summary: Desactivar usuario (STORE_ADMIN)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Usuario desactivado
 */

/**
 * @swagger
 * /users/{id}/lock:
 *   patch:
 *     summary: Bloquear usuario (STORE_ADMIN)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Usuario bloqueado
 */

/**
 * @swagger
 * /users/{id}/change-password:
 *   patch:
 *     summary: Cambiar contraseña de un usuario (usuario autenticado o STORE_ADMIN)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [new_password]
 *             properties:
 *               current_password: { type: string }
 *               new_password:     { type: string }
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 */

module.exports = ({ forgotPasswordLimiter }) => {
  const router = require('express').Router();

  // Rutas públicas (sin autenticación) — con rate limit por IP (A-07)
  router.post('/forgot-password', forgotPasswordLimiter, controller.forgotPassword);
  router.post('/reset-password',  forgotPasswordLimiter, controller.resetPassword);

  // Rutas protegidas
  router.get('/',    authenticate, platformStoreAccess('STORE_ADMIN'), controller.list);
  router.get('/:id', authenticate, platformStoreAccess('STORE_ADMIN'), controller.getById);
  // PLATFORM_ADMIN puede crear usuarios para cualquier empresa (pasa company_id en el body)
  router.post('/',   authenticate, authorize('STORE_ADMIN', 'PLATFORM'), controller.create);
  router.put('/:id', authenticate, platformStoreAccess('STORE_ADMIN'), controller.update);

  router.patch('/:id/activate',        authenticate, platformStoreAccess('STORE_ADMIN'), controller.activate);
  router.patch('/:id/deactivate',      authenticate, platformStoreAccess('STORE_ADMIN'), controller.deactivate);
  router.patch('/:id/lock',            authenticate, platformStoreAccess('STORE_ADMIN'), controller.lock);
  router.patch('/:id/change-password', authenticate, controller.changePassword);
  router.delete('/:id',                authenticate, platformStoreAccess('STORE_ADMIN'), controller.remove);

  return router;
};
