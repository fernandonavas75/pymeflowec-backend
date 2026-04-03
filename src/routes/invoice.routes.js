'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/invoice.controller');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');
const validate     = require('../middlewares/validate');
const { createFromOrderRules, createManualRules } = require('../validators/invoice.validators');

/**
 * @swagger
 * tags:
 *   name: Facturas
 *   description: Gestión de facturas
 */

/**
 * @swagger
 * /invoices:
 *   get:
 *     summary: Obtener lista de facturas
 *     tags: [Facturas]
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
 *           enum: [pending, paid, overdue, cancelled]
 *         description: Estado de la factura
 *     responses:
 *       200:
 *         description: Lista de facturas obtenida exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.get('/',
  authenticate,
  authorize('invoices.view'),
  controller.list
);

/**
 * @swagger
 * /invoices/{id}:
 *   get:
 *     summary: Obtener factura por ID
 *     tags: [Facturas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la factura
 *     responses:
 *       200:
 *         description: Factura encontrada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Factura no encontrada
 */
router.get('/:id',
  authenticate,
  authorize('invoices.view'),
  controller.getById
);

/**
 * @swagger
 * /invoices/from-order:
 *   post:
 *     summary: Crear factura desde orden
 *     tags: [Facturas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_id
 *             properties:
 *               order_id:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID de la orden
 *     responses:
 *       201:
 *         description: Factura creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.post('/from-order',
  authenticate,
  authorize('invoices.create'),
  validate(createFromOrderRules),
  controller.createFromOrder
);

/**
 * @swagger
 * /invoices/manual:
 *   post:
 *     summary: Crear factura manual
 *     tags: [Facturas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - issue_date
 *               - items
 *             properties:
 *               issue_date:
 *                 type: string
 *                 format: date
 *                 description: Fecha de emisión
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_id
 *                     - quantity
 *                     - unit_price
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                       minimum: 1
 *                       description: ID del producto
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       description: Cantidad
 *                     unit_price:
 *                       type: number
 *                       format: float
 *                       minimum: 0.01
 *                       description: Precio unitario
 *     responses:
 *       201:
 *         description: Factura creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.post('/manual',
  authenticate,
  authorize('invoices.create'),
  validate(createManualRules),
  controller.createManual
);

/**
 * @swagger
 * /invoices/{id}/paid:
 *   patch:
 *     summary: Marcar factura como pagada
 *     tags: [Facturas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la factura
 *     responses:
 *       200:
 *         description: Factura marcada como pagada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Factura no encontrada
 */
router.patch('/:id/paid',
  authenticate,
  authorize('invoices.create'),
  controller.markPaid
);

/**
 * @swagger
 * /invoices/{id}/overdue:
 *   patch:
 *     summary: Marcar factura como vencida
 *     tags: [Facturas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la factura
 *     responses:
 *       200:
 *         description: Factura marcada como vencida
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Factura no encontrada
 */
router.patch('/:id/overdue',
  authenticate,
  authorize('invoices.create'),
  controller.markOverdue
);

/**
 * @swagger
 * /invoices/{id}/cancel:
 *   patch:
 *     summary: Cancelar factura
 *     tags: [Facturas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la factura
 *     responses:
 *       200:
 *         description: Factura cancelada exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Factura no encontrada
 */
router.patch('/:id/cancel',
  authenticate,
  authorize('invoices.cancel'),
  controller.cancel
);

module.exports = router;
