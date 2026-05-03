'use strict';

const router              = require('express').Router();
const controller          = require('../controllers/expense.controller');
const authenticate        = require('../middlewares/authenticate');
const platformStoreAccess = require('../middlewares/platformStoreAccess');
const { checkModuleExpiry } = require('../middlewares/checkModuleExpiry');
const validate            = require('../middlewares/validate');
const { createRules, updateRules } = require('../validators/expense.validators');

router.use(authenticate, checkModuleExpiry('MOD_FINANCE'));

/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: Egresos operacionales (MOD_FINANCE)
 */

/**
 * @swagger
 * /expenses:
 *   get:
 *     summary: Listar egresos (filtrar por ?payment_status=&category_id=&from=&to=)
 *     tags: [Expenses]
 *     parameters:
 *       - in: query
 *         name: payment_status
 *         schema: { type: string, enum: [PENDIENTE,PARCIAL,PAGADO,ANULADO] }
 *       - in: query
 *         name: category_id
 *         schema: { type: integer }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Lista de egresos
 */
router.get('/',    platformStoreAccess('STORE'), controller.list);
router.get('/:id', platformStoreAccess('STORE'), controller.getById);

/**
 * @swagger
 * /expenses:
 *   post:
 *     summary: Crear egreso
 *     tags: [Expenses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category_id, description, amount]
 *             properties:
 *               category_id:        { type: integer }
 *               description:        { type: string }
 *               amount:             { type: number }
 *               supplier_id:        { type: integer }
 *               supplier_name_free: { type: string }
 *               expense_date:       { type: string, format: date }
 *               voucher_number:     { type: string }
 *               voucher_type:       { type: string, enum: [FACTURA,NOTA_VENTA,RECIBO,LIQUIDACION,SIN_COMPROBANTE,OTRO] }
 *               notes:              { type: string }
 *     responses:
 *       201:
 *         description: Egreso creado
 */
router.post('/',            platformStoreAccess('STORE_ADMIN'), validate(createRules), controller.create);
router.put('/:id',          platformStoreAccess('STORE_ADMIN'), validate(updateRules), controller.update);
router.patch('/:id/annul',  platformStoreAccess('STORE_ADMIN'), controller.annul);

module.exports = router;
