'use strict';

const router                 = require('express').Router();
const controller             = require('../controllers/taxRate.controller');
const authenticate           = require('../middlewares/authenticate');
const platformStoreAccess    = require('../middlewares/platformStoreAccess');
const { checkModuleExpiry }  = require('../middlewares/checkModuleExpiry');

/**
 * @swagger
 * tags:
 *   name: TaxRates
 *   description: Tasas de impuesto de la tienda (MOD_TAX)
 */

/**
 * @swagger
 * /tax-rates:
 *   get:
 *     summary: Listar tasas de impuesto
 *     tags: [TaxRates]
 *     responses:
 *       200:
 *         description: Lista de tasas de impuesto
 *   post:
 *     summary: Crear tasa de impuesto (STORE_ADMIN)
 *     tags: [TaxRates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, rate]
 *             properties:
 *               name: { type: string }
 *               rate: { type: number, description: "Porcentaje (ej. 15 para 15%)" }
 *     responses:
 *       201:
 *         description: Tasa de impuesto creada
 */

/**
 * @swagger
 * /tax-rates/{id}:
 *   get:
 *     summary: Obtener tasa de impuesto por ID
 *     tags: [TaxRates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Datos de la tasa
 *       404:
 *         description: No encontrada
 *   put:
 *     summary: Actualizar tasa de impuesto (STORE_ADMIN)
 *     tags: [TaxRates]
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
 *             properties:
 *               name: { type: string }
 *               rate: { type: number }
 *     responses:
 *       200:
 *         description: Tasa actualizada
 */

router.use(authenticate, checkModuleExpiry('MOD_TAX'));

router.get('/',    platformStoreAccess('STORE'),        controller.list);
router.get('/:id', platformStoreAccess('STORE'),        controller.getById);
router.post('/',   platformStoreAccess('STORE_ADMIN'),  controller.create);
router.put('/:id', platformStoreAccess('STORE_ADMIN'),  controller.update);

module.exports = router;
