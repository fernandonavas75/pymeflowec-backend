'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/invoice.controller');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: Gestión de facturas
 */

/**
 * @swagger
 * /invoices:
 *   get:
 *     summary: Listar facturas
 *     tags: [Invoices]
 *     responses:
 *       200:
 *         description: Lista de facturas
 */
router.get('/',
  authenticate,
  authorize('admin', 'manager', 'seller', 'viewer'),
  controller.list
);

/**
 * @swagger
 * /invoices/{id}:
 *   get:
 *     summary: Obtener factura por ID
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Factura encontrada
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
 * /invoices/from-order:
 *   post:
 *     summary: Generar factura desde una orden
 *     tags: [Invoices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_id]
 *             properties:
 *               order_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Factura generada
 */
router.post('/from-order',
  authenticate,
  authorize('admin', 'manager', 'seller'),
  controller.createFromOrder
);

/**
 * @swagger
 * /invoices/manual:
 *   post:
 *     summary: Crear factura manual
 *     tags: [Invoices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
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
 *         description: Factura creada
 */
router.post('/manual',
  authenticate,
  authorize('admin', 'manager'),
  controller.createManual
);

/**
 * @swagger
 * /invoices/{id}/paid:
 *   patch:
 *     summary: Marcar factura como pagada
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Factura pagada
 */
router.patch('/:id/paid',
  authenticate,
  authorize('admin', 'manager'),
  controller.markPaid
);

/**
 * @swagger
 * /invoices/{id}/overdue:
 *   patch:
 *     summary: Marcar factura como vencida
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Factura marcada como vencida
 */
router.patch('/:id/overdue',
  authenticate,
  authorize('admin', 'manager'),
  controller.markOverdue
);

/**
 * @swagger
 * /invoices/{id}/cancel:
 *   patch:
 *     summary: Cancelar factura
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Factura cancelada
 */
router.patch('/:id/cancel',
  authenticate,
  authorize('admin', 'manager'),
  controller.cancel
);

module.exports = router;