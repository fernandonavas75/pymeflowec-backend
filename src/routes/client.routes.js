'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/client.controller');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');
const validate     = require('../middlewares/validate');
const { createRules, updateRules } = require('../validators/client.validators');

/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: Gestión de clientes de la organización
 */

/**
 * @swagger
 * /clients:
 *   get:
 *     summary: Listar clientes
 *     tags: [Clients]
 *     responses:
 *       200:
 *         description: Lista de clientes
 */
router.get('/',
  authenticate,
  authorize('clients.view'),
  controller.list
);

/**
 * @swagger
 * /clients/{id}:
 *   get:
 *     summary: Obtener cliente por ID
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *       404:
 *         description: No encontrado
 */
router.get('/:id',
  authenticate,
  authorize('clients.view'),
  controller.getById
);

/**
 * @swagger
 * /clients:
 *   post:
 *     summary: Crear cliente
 *     tags: [Clients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, identification]
 *             properties:
 *               full_name:
 *                 type: string
 *               identification:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cliente creado
 */
router.post('/',
  authenticate,
  authorize('clients.create'),
  validate(createRules),
  controller.create
);

/**
 * @swagger
 * /clients/{id}:
 *   put:
 *     summary: Actualizar cliente
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cliente actualizado
 */
router.put('/:id',
  authenticate,
  authorize('clients.edit'),
  validate(updateRules),
  controller.update
);

/**
 * @swagger
 * /clients/{id}/activate:
 *   patch:
 *     summary: Activar cliente
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cliente activado
 */
router.patch('/:id/activate',
  authenticate,
  authorize('clients.edit'),
  controller.activate
);

/**
 * @swagger
 * /clients/{id}/deactivate:
 *   patch:
 *     summary: Desactivar cliente
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cliente desactivado
 */
router.patch('/:id/deactivate',
  authenticate,
  authorize('clients.edit'),
  controller.deactivate
);

/**
 * @swagger
 * /clients/{id}:
 *   delete:
 *     summary: Eliminar cliente (soft delete)
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cliente eliminado
 *       404:
 *         description: No encontrado
 */
router.delete('/:id',
  authenticate,
  authorize('clients.edit'),
  controller.remove
);

module.exports = router;