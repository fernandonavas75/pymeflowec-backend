'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/organization.controller');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');

/**
 * @swagger
 * tags:
 *   name: Organizations
 *   description: Gestión de organizaciones (solo superadmin)
 */

/**
 * @swagger
 * /organizations:
 *   get:
 *     summary: Listar todas las organizaciones
 *     tags: [Organizations]
 *     responses:
 *       200:
 *         description: Lista de organizaciones
 */
router.get('/',
  authenticate,
  authorize('superadmin'),
  controller.list
);

/**
 * @swagger
 * /organizations/{id}:
 *   get:
 *     summary: Obtener organización por ID
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Organización encontrada
 *       404:
 *         description: No encontrada
 */
router.get('/:id',
  authenticate,
  authorize('superadmin'),
  controller.getById
);

/**
 * @swagger
 * /organizations:
 *   post:
 *     summary: Crear organización
 *     tags: [Organizations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, ruc]
 *             properties:
 *               name:
 *                 type: string
 *               ruc:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Organización creada
 */
router.post('/',
  authenticate,
  authorize('superadmin'),
  controller.create
);

/**
 * @swagger
 * /organizations/{id}:
 *   put:
 *     summary: Actualizar organización
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Organización actualizada
 */
router.put('/:id',
  authenticate,
  authorize('superadmin'),
  controller.update
);

/**
 * @swagger
 * /organizations/{id}/activate:
 *   patch:
 *     summary: Activar organización
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Organización activada
 */
router.patch('/:id/activate',
  authenticate,
  authorize('superadmin'),
  controller.activate
);

/**
 * @swagger
 * /organizations/{id}/deactivate:
 *   patch:
 *     summary: Desactivar organización
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Organización desactivada
 */
router.patch('/:id/deactivate',
  authenticate,
  authorize('superadmin'),
  controller.deactivate
);

module.exports = router;