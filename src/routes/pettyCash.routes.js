'use strict';

const router              = require('express').Router();
const controller          = require('../controllers/pettyCash.controller');
const authenticate        = require('../middlewares/authenticate');
const platformStoreAccess = require('../middlewares/platformStoreAccess');
const { checkModuleExpiry } = require('../middlewares/checkModuleExpiry');
const { validate }        = require('../middlewares/validate');
const { openRules, closeRules, movementRules } = require('../validators/pettyCash.validators');

router.use(authenticate, checkModuleExpiry('MOD_FINANCE'));

/**
 * @swagger
 * tags:
 *   name: PettyCash
 *   description: Caja chica — sesiones y movimientos (MOD_FINANCE)
 */

/**
 * @swagger
 * /petty-cash:
 *   get:
 *     summary: Listar sesiones de caja chica
 *     tags: [PettyCash]
 *     responses:
 *       200:
 *         description: Lista de sesiones
 */
router.get('/', platformStoreAccess('STORE'), controller.list);

/**
 * @swagger
 * /petty-cash/open:
 *   get:
 *     summary: Obtener sesión abierta actualmente
 *     tags: [PettyCash]
 *     responses:
 *       200:
 *         description: Sesión abierta
 *       404:
 *         description: No hay sesión abierta
 */
router.get('/open', platformStoreAccess('STORE'), controller.getOpenSession);

/**
 * @swagger
 * /petty-cash/open:
 *   post:
 *     summary: Abrir sesión de caja chica
 *     tags: [PettyCash]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [opening_amount]
 *             properties:
 *               opening_amount: { type: number }
 *               name:           { type: string }
 *               notes:          { type: string }
 *     responses:
 *       201:
 *         description: Sesión abierta
 */
router.post('/open', platformStoreAccess('STORE_ADMIN'), validate(openRules), controller.open);

/**
 * @swagger
 * /petty-cash/{id}/close:
 *   patch:
 *     summary: Cerrar sesión de caja chica
 *     tags: [PettyCash]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               closing_amount_reported: { type: number }
 *               notes:                   { type: string }
 *     responses:
 *       200:
 *         description: Sesión cerrada
 */
router.patch('/:id/close', platformStoreAccess('STORE_ADMIN'), validate(closeRules), controller.close);

/**
 * @swagger
 * /petty-cash/{id}/movements:
 *   get:
 *     summary: Listar movimientos de una sesión
 *     tags: [PettyCash]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista de movimientos
 */
router.get('/:id/movements', platformStoreAccess('STORE'), controller.listMovements);

/**
 * @swagger
 * /petty-cash/{id}/movements:
 *   post:
 *     summary: Registrar movimiento en caja chica
 *     tags: [PettyCash]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [movement_type, amount, description]
 *             properties:
 *               movement_type:  { type: string, enum: [EXPENSE,REPLENISH,ADJUSTMENT] }
 *               amount:         { type: number }
 *               description:    { type: string }
 *               category_id:    { type: integer }
 *               voucher_number: { type: string }
 *     responses:
 *       201:
 *         description: Movimiento registrado
 */
router.post('/:id/movements', platformStoreAccess('STORE_ADMIN', 'STORE_SELLER'), validate(movementRules), controller.addMovement);

module.exports = router;
