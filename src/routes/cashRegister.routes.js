'use strict';

const router     = require('express').Router();
const controller = require('../controllers/cashRegister.controller');
const auth       = require('../middlewares/authenticate');
const authz      = require('../middlewares/authorize');
const validate   = require('../middlewares/validate');
const { openRules, closeRules, movementRules } = require('../validators/cashRegister.validators');

/**
 * @swagger
 * tags:
 *   name: Caja Registradora
 *   description: Gestión de la caja registradora
 */

/**
 * @swagger
 * /cash-registers:
 *   get:
 *     summary: Obtener lista de cajas registradoras
 *     tags: [Caja Registradora]
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
 *     responses:
 *       200:
 *         description: Lista de cajas obtenida exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.get('/',    auth, authz('cash_register.operate'), controller.list);

/**
 * @swagger
 * /cash-registers/{id}:
 *   get:
 *     summary: Obtener caja registradora por ID
 *     tags: [Caja Registradora]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la caja registradora
 *     responses:
 *       200:
 *         description: Caja encontrada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Caja no encontrada
 */
router.get('/:id', auth, authz('cash_register.operate'), controller.getById);

/**
 * @swagger
 * /cash-registers:
 *   post:
 *     summary: Abrir caja registradora
 *     tags: [Caja Registradora]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               opening_amount:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Monto de apertura
 *     responses:
 *       201:
 *         description: Caja abierta exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.post('/',   auth, authz('cash_register.operate'), validate(openRules), controller.open);

/**
 * @swagger
 * /cash-registers/{id}/close:
 *   patch:
 *     summary: Cerrar caja registradora
 *     tags: [Caja Registradora]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la caja registradora
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - actual_amount
 *             properties:
 *               actual_amount:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Monto contado
 *               notes:
 *                 type: string
 *                 description: Notas
 *     responses:
 *       200:
 *         description: Caja cerrada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Caja no encontrada
 */
router.patch('/:id/close',    auth, authz('cash_register.close'),   validate(closeRules),    controller.close);

/**
 * @swagger
 * /cash-registers/{id}/movements:
 *   post:
 *     summary: Agregar movimiento a caja registradora
 *     tags: [Caja Registradora]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la caja registradora
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - movement_type
 *               - amount
 *             properties:
 *               movement_type:
 *                 type: string
 *                 enum: [withdrawal, deposit]
 *                 description: Tipo de movimiento
 *               amount:
 *                 type: number
 *                 format: float
 *                 minimum: 0.01
 *                 description: Monto
 *               description:
 *                 type: string
 *                 description: Descripción
 *     responses:
 *       201:
 *         description: Movimiento agregado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Caja no encontrada
 */
router.post('/:id/movements', auth, authz('cash_register.operate'), validate(movementRules), controller.addMovement);

module.exports = router;
