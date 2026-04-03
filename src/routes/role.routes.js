'use strict';

const router     = require('express').Router();
const controller = require('../controllers/role.controller');
const auth       = require('../middlewares/authenticate');
const authz      = require('../middlewares/authorize');
const validate   = require('../middlewares/validate');
const { createRules, updateRules } = require('../validators/role.validators');

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Gestión de roles y permisos
 */

/**
 * @swagger
 * /roles/permissions:
 *   get:
 *     summary: Obtener lista de permisos
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: Lista de permisos obtenida exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.get('/permissions', auth, authz('roles.manage'), controller.listPermissions);

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Obtener lista de roles
 *     tags: [Roles]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Límite de resultados por página
 *     responses:
 *       200:
 *         description: Lista de roles obtenida exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.get('/',    auth, authz('roles.manage'), controller.list);

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     summary: Obtener rol por ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     responses:
 *       200:
 *         description: Rol encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Rol no encontrado
 */
router.get('/:id', auth, authz('roles.manage'), controller.getById);

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Crear rol
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del rol
 *               description:
 *                 type: string
 *                 description: Descripción
 *               permission_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   minimum: 1
 *                 description: IDs de permisos
 *     responses:
 *       201:
 *         description: Rol creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.post('/',   auth, authz('roles.manage'), validate(createRules), controller.create);

/**
 * @swagger
 * /roles/{id}:
 *   put:
 *     summary: Actualizar rol
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del rol
 *               description:
 *                 type: string
 *                 description: Descripción
 *               permission_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   minimum: 1
 *                 description: IDs de permisos
 *     responses:
 *       200:
 *         description: Rol actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Rol no encontrado
 */
router.put('/:id', auth, authz('roles.manage'), validate(updateRules), controller.update);

/**
 * @swagger
 * /roles/{id}:
 *   delete:
 *     summary: Eliminar rol
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     responses:
 *       200:
 *         description: Rol eliminado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Rol no encontrado
 */
router.delete('/:id', auth, authz('roles.manage'), controller.remove);

module.exports = router;
