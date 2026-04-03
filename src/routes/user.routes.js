'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/user.controller');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');
const validate     = require('../middlewares/validate');
const { createRules, updateRules, changePasswordRules } = require('../validators/user.validators');

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
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Límite de resultados por página
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */
router.get('/',
  authenticate,
  authorize('users.view'),
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
 *         description: Usuario no encontrado
 */
router.get('/:id',
  authenticate,
  authorize('users.view'),
  controller.getById
);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Crear nuevo usuario
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
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               role_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Usuario creado
 *       400:
 *         description: Datos inválidos
 */
router.post('/',
  authenticate,
  authorize('users.manage'),
  validate(createRules),
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/:id',
  authenticate,
  authorize('users.manage'),
  validate(updateRules),
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
  authorize('users.manage'),
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
  authorize('users.manage'),
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
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Contraseña cambiada
 */
router.patch('/:id/change-password',
  authenticate,
  validate(changePasswordRules),
  controller.changePassword
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Eliminar usuario
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario eliminado
 */
router.delete('/:id',
  authenticate,
  authorize('users.manage'),
  controller.remove
);

module.exports = router;
