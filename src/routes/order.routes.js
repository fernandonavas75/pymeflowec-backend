'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/order.controller');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');
const validate     = require('../middlewares/validate');
const { createRules } = require('../validators/order.validators');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Gestión de órdenes
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Listar órdenes
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Lista de órdenes
 */
router.get('/',
  authenticate,
  authorize('admin', 'manager', 'seller', 'viewer'),
  controller.list
);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Obtener orden por ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Orden encontrada
 *       404:
 *         description: No encontrada
 */
router.get('/:id',
  authenticate,
  authorize('admin', 'manager', 'seller', 'viewer'),
  controller.getById
);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Crear orden
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [client_id, items]
 *             properties:
 *               client_id:
 *                 type: integer
 *               order_date:
 *                 type: string
 *                 format: date
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [product_id, quantity]
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Orden creada
 */
router.post('/',
  authenticate,
  authorize('admin', 'manager', 'seller'),
  validate(createRules),
  controller.create
);

/**
 * @swagger
 * /orders/{id}/confirm:
 *   patch:
 *     summary: Confirmar orden
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Orden confirmada
 */
router.patch('/:id/confirm',
  authenticate,
  authorize('admin', 'manager', 'seller'),
  controller.confirm
);

/**
 * @swagger
 * /orders/{id}/ship:
 *   patch:
 *     summary: Marcar orden como enviada
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Orden enviada
 */
router.patch('/:id/ship',
  authenticate,
  authorize('admin', 'manager'),
  controller.ship
);

/**
 * @swagger
 * /orders/{id}/deliver:
 *   patch:
 *     summary: Marcar orden como entregada
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Orden entregada
 */
router.patch('/:id/deliver',
  authenticate,
  authorize('admin', 'manager'),
  controller.deliver
);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   patch:
 *     summary: Cancelar orden
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Orden cancelada
 */
router.patch('/:id/cancel',
  authenticate,
  authorize('admin', 'manager'),
  controller.cancel
);

module.exports = router;