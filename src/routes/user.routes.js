'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/user.controller');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios de la organización
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Listar usuarios de la organización
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */
router.get('/',
  authenticate,
  authorize('admin', 'manager'),
  controller.list
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *       404:
 *         description: No encontrado
 */
router.get('/:id',
  authenticate,
  authorize('admin', 'manager'),
  controller.getById
);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Crear usuario
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, email, password, role_id]
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Usuario creado
 */
router.post('/',
  authenticate,
  authorize('admin'),
  controller.create
);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario actualizado
 */
router.put('/:id',
  authenticate,
  authorize('admin'),
  controller.update
);

/**
 * @swagger
 * /users/{id}/activate:
 *   patch:
 *     summary: Activar usuario
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario activado
 */
router.patch('/:id/activate',
  authenticate,
  authorize('admin'),
  controller.activate
);

/**
 * @swagger
 * /users/{id}/deactivate:
 *   patch:
 *     summary: Desactivar usuario
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario desactivado
 */
router.patch('/:id/deactivate',
  authenticate,
  authorize('admin'),
  controller.deactivate
);

/**
 * @swagger
 * /users/{id}/change-password:
 *   patch:
 *     summary: Cambiar contraseña
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [current_password, new_password]
 *             properties:
 *               current_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 */
router.patch('/:id/change-password',
  authenticate,
  authorize('admin', 'manager', 'seller', 'viewer'),
  controller.changePassword
);

module.exports = router;