'use strict';

const router              = require('express').Router();
const controller          = require('../controllers/invoicePayment.controller');
const authenticate        = require('../middlewares/authenticate');
const platformStoreAccess = require('../middlewares/platformStoreAccess');
const { checkModuleExpiry } = require('../middlewares/checkModuleExpiry');
const validate            = require('../middlewares/validate');
const { createRules }     = require('../validators/invoicePayment.validators');

router.use(authenticate, checkModuleExpiry('MOD_INVOICING'));

/**
 * @swagger
 * tags:
 *   name: InvoicePayments
 *   description: Cobros de facturas (MOD_INVOICING)
 */

/**
 * @swagger
 * /invoice-payments:
 *   get:
 *     summary: Listar cobros (filtrar por ?invoice_id=)
 *     tags: [InvoicePayments]
 *     parameters:
 *       - in: query
 *         name: invoice_id
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista de cobros
 */
router.get('/',    platformStoreAccess('STORE'), controller.list);

/**
 * @swagger
 * /invoice-payments/{id}:
 *   get:
 *     summary: Obtener cobro por ID
 *     tags: [InvoicePayments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Cobro encontrado
 */
router.get('/:id', platformStoreAccess('STORE'), controller.getById);

/**
 * @swagger
 * /invoice-payments:
 *   post:
 *     summary: Registrar cobro de factura
 *     tags: [InvoicePayments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invoice_id, amount, payment_method]
 *             properties:
 *               invoice_id:         { type: integer }
 *               amount:             { type: number }
 *               payment_method:     { type: string, enum: [EFECTIVO,TRANSFERENCIA,TARJETA_DEBITO,TARJETA_CREDITO,CHEQUE,OTRO] }
 *               payment_date:       { type: string, format: date }
 *               transfer_reference: { type: string }
 *               card_contrapartida: { type: string }
 *               cheque_number:      { type: string }
 *               installment_number: { type: integer }
 *               installment_total:  { type: integer }
 *               due_date:           { type: string, format: date }
 *               status:             { type: string, enum: [PENDIENTE,COBRADO] }
 *               notes:              { type: string }
 *     responses:
 *       201:
 *         description: Cobro registrado
 */
router.post('/', platformStoreAccess('STORE_ADMIN', 'STORE_SELLER'), validate(createRules), controller.create);

/**
 * @swagger
 * /invoice-payments/{id}/annul:
 *   patch:
 *     summary: Anular cobro
 *     tags: [InvoicePayments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Cobro anulado
 */
router.patch('/:id/annul', platformStoreAccess('STORE_ADMIN'), controller.annul);

module.exports = router;
