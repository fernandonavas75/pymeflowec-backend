'use strict';

const router              = require('express').Router();
const controller          = require('../controllers/inventoryMovement.controller');
const authenticate        = require('../middlewares/authenticate');
const platformStoreAccess = require('../middlewares/platformStoreAccess');
const { checkModuleExpiry } = require('../middlewares/checkModuleExpiry');
const validate            = require('../middlewares/validate');
const { createRules }     = require('../validators/inventoryMovement.validators');

router.use(authenticate, checkModuleExpiry('MOD_PRODUCTS'));

/**
 * @swagger
 * tags:
 *   name: InventoryMovements
 *   description: Movimientos de inventario (MOD_INVENTORY)
 */

/**
 * @swagger
 * /inventory-movements:
 *   get:
 *     summary: Listar movimientos (filtrar por ?product_id=&movement_type=&from=&to=)
 *     tags: [InventoryMovements]
 *     parameters:
 *       - in: query
 *         name: product_id
 *         schema: { type: integer }
 *       - in: query
 *         name: movement_type
 *         schema: { type: string, enum: [IN,OUT,ADJUSTMENT] }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Lista de movimientos de inventario
 */
router.get('/', platformStoreAccess('STORE'), controller.list);

/**
 * @swagger
 * /inventory-movements:
 *   post:
 *     summary: Registrar movimiento manual (IN / OUT / ADJUSTMENT)
 *     tags: [InventoryMovements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id, movement_type, quantity]
 *             properties:
 *               product_id:     { type: integer }
 *               movement_type:  { type: string, enum: [IN,OUT,ADJUSTMENT] }
 *               quantity:       { type: integer }
 *               reference_type: { type: string, enum: [PURCHASE,SALE,MANUAL] }
 *               notes:          { type: string }
 *     responses:
 *       201:
 *         description: Movimiento registrado
 */
router.post('/', platformStoreAccess('STORE_ADMIN', 'STORE_WAREHOUSE'), validate(createRules), controller.createManual);

module.exports = router;
