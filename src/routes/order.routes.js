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
 *   name: Órdenes
 *   description: Gestión de órdenes
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Obtener lista de órdenes
 *     tags: [Órdenes]
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, shipped, delivered, cancelled]
 *         description: Estado de la orden
 *     responses:
 *       200:
 *         description: Lista de órdenes obtenida exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.get('/',
  authenticate,
  authorize('orders.view'),
  controller.list
);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Obtener orden por ID
 *     tags: [Órdenes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden
 *     responses:
 *       200:
 *         description: Orden encontrada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Orden no encontrada
 */
router.get('/:id',
  authenticate,
  authorize('orders.view'),
  controller.getById
);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Crear orden
 *     tags: [Órdenes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - client_id
 *               - items
 *             properties:
 *               client_id:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID del cliente
 *               order_date:
 *                 type: string
 *                 format: date
 *                 description: Fecha de la orden
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_id
 *                     - quantity
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                       minimum: 1
 *                       description: ID del producto
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       description: Cantidad
 *     responses:
 *       201:
 *         description: Orden creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.post('/',
  authenticate,
  authorize('orders.create'),
  validate(createRules),
  controller.create
);

/**
 * @swagger
 * /orders/{id}/confirm:
 *   patch:
 *     summary: Confirmar orden
 *     tags: [Órdenes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden
 *     responses:
 *       200:
 *         description: Orden confirmada exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Orden no encontrada
 */
router.patch('/:id/confirm',
  authenticate,
  authorize('orders.create'),
  controller.confirm
);

/**
 * @swagger
 * /orders/{id}/ship:
 *   patch:
 *     summary: Enviar orden
 *     tags: [Órdenes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden
 *     responses:
 *       200:
 *         description: Orden enviada exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Orden no encontrada
 */
router.patch('/:id/ship',
  authenticate,
  authorize('orders.edit'),
  controller.ship
);

/**
 * @swagger
 * /orders/{id}/deliver:
 *   patch:
 *     summary: Entregar orden
 *     tags: [Órdenes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden
 *     responses:
 *       200:
 *         description: Orden entregada exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Orden no encontrada
 */
router.patch('/:id/deliver',
  authenticate,
  authorize('orders.edit'),
  controller.deliver
);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   patch:
 *     summary: Cancelar orden
 *     tags: [Órdenes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden
 *     responses:
 *       200:
 *         description: Orden cancelada exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Orden no encontrada
 */
router.patch('/:id/cancel',
  authenticate,
  authorize('orders.edit'),
  controller.cancel
);

module.exports = router;
