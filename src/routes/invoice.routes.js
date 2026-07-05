'use strict';

const router                 = require('express').Router();
const controller             = require('../controllers/invoice.controller');
const authenticate           = require('../middlewares/authenticate');
const platformStoreAccess    = require('../middlewares/platformStoreAccess');
const { checkModuleExpiry }  = require('../middlewares/checkModuleExpiry');
const validate               = require('../middlewares/validate');
const { createRules }        = require('../validators/invoice.validators');

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: Facturación electrónica (MOD_INVOICING)
 */

/**
 * @swagger
 * /invoices:
 *   get:
 *     summary: Listar facturas de la tienda
 *     tags: [Invoices]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [BORRADOR,EMITIDA,ANULADA] }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Lista de facturas
 *   post:
 *     summary: Crear factura (STORE_ADMIN o STORE_SELLER)
 *     tags: [Invoices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customer_id, items]
 *             properties:
 *               customer_id: { type: integer }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [product_id, quantity]
 *                   properties:
 *                     product_id:  { type: integer }
 *                     quantity:    { type: integer, minimum: 1 }
 *                     discount:    { type: number, minimum: 0 }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Factura creada (el precio unitario se toma del catálogo de productos)
 *       422:
 *         description: Datos de entrada inválidos
 */

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
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Datos de la factura
 *       404:
 *         description: No encontrada
 */

/**
 * @swagger
 * /invoices/{id}/cancel:
 *   patch:
 *     summary: Anular factura (STORE_ADMIN)
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Factura anulada
 */

router.use(authenticate, checkModuleExpiry('MOD_INVOICING'));

router.get('/',             platformStoreAccess('STORE'),                        controller.list);
router.get('/:id',          platformStoreAccess('STORE'),                        controller.getById);
router.post('/',            platformStoreAccess('STORE_ADMIN', 'STORE_SELLER'),  validate(createRules), controller.create);
router.patch('/:id/cancel', platformStoreAccess('STORE_ADMIN'),                  controller.cancel);

module.exports = router;
