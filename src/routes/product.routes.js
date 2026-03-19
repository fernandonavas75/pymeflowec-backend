'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/product.controller');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Gestión de productos e inventario
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Listar productos
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Lista de productos
 */
router.get('/',
  authenticate,
  authorize('admin', 'manager', 'seller', 'viewer'),
  controller.list
);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Obtener producto por ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Producto encontrado
 *       404:
 *         description: No encontrado
 */
router.get('/:id',
  authenticate,
  authorize('admin', 'manager', 'seller', 'viewer'),
  controller.getById
);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Crear producto
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, unit_price]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               stock:
 *                 type: integer
 *               unit_price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Producto creado
 */
router.post('/',
  authenticate,
  authorize('admin', 'manager'),
  controller.create
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Actualizar producto
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Producto actualizado
 */
router.put('/:id',
  authenticate,
  authorize('admin', 'manager'),
  controller.update
);

/**
 * @swagger
 * /products/{id}/stock:
 *   patch:
 *     summary: Actualizar stock
 *     tags: [Products]
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
 *             required: [stock]
 *             properties:
 *               stock:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Stock actualizado
 */
router.patch('/:id/stock',
  authenticate,
  authorize('admin', 'manager'),
  controller.updateStock
);

/**
 * @swagger
 * /products/{id}/activate:
 *   patch:
 *     summary: Activar producto
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Producto activado
 */
router.patch('/:id/activate',
  authenticate,
  authorize('admin', 'manager'),
  controller.activate
);

/**
 * @swagger
 * /products/{id}/deactivate:
 *   patch:
 *     summary: Desactivar producto
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Producto desactivado
 */
router.patch('/:id/deactivate',
  authenticate,
  authorize('admin', 'manager'),
  controller.deactivate
);

module.exports = router;