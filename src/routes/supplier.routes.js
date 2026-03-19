'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/supplier.controller');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');

/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: Gestión de proveedores de la organización
 */

/**
 * @swagger
 * /suppliers:
 *   get:
 *     summary: Listar proveedores
 *     tags: [Suppliers]
 *     responses:
 *       200:
 *         description: Lista de proveedores
 */
router.get('/',
  authenticate,
  authorize('admin', 'manager'),
  controller.list
);

/**
 * @swagger
 * /suppliers/{id}:
 *   get:
 *     summary: Obtener proveedor por ID
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Proveedor encontrado
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
 * /suppliers:
 *   post:
 *     summary: Crear proveedor
 *     tags: [Suppliers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [business_name]
 *             properties:
 *               business_name:
 *                 type: string
 *               contact_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Proveedor creado
 */
router.post('/',
  authenticate,
  authorize('admin', 'manager'),
  controller.create
);

/**
 * @swagger
 * /suppliers/{id}:
 *   put:
 *     summary: Actualizar proveedor
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Proveedor actualizado
 */
router.put('/:id',
  authenticate,
  authorize('admin', 'manager'),
  controller.update
);

/**
 * @swagger
 * /suppliers/{id}/activate:
 *   patch:
 *     summary: Activar proveedor
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Proveedor activado
 */
router.patch('/:id/activate',
  authenticate,
  authorize('admin', 'manager'),
  controller.activate
);

/**
 * @swagger
 * /suppliers/{id}/deactivate:
 *   patch:
 *     summary: Desactivar proveedor
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Proveedor desactivado
 */
router.patch('/:id/deactivate',
  authenticate,
  authorize('admin', 'manager'),
  controller.deactivate
);

module.exports = router;