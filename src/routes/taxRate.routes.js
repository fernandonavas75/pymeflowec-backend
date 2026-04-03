'use strict';

const router     = require('express').Router();
const controller = require('../controllers/taxRate.controller');
const auth       = require('../middlewares/authenticate');
const authz      = require('../middlewares/authorize');
const validate   = require('../middlewares/validate');
const { createRules, updateRules } = require('../validators/taxRate.validators');

/**
 * @swagger
 * tags:
 *   name: Tasas de Impuesto
 *   description: Gestión de tasas de impuesto
 */

/**
 * @swagger
 * /tax-rates:
 *   get:
 *     summary: Obtener lista de tasas de impuesto
 *     tags: [Tasas de Impuesto]
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
 *         description: Lista de tasas obtenida exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.get('/',    auth, authz('products.view'),    controller.list);

/**
 * @swagger
 * /tax-rates/{id}:
 *   get:
 *     summary: Obtener tasa de impuesto por ID
 *     tags: [Tasas de Impuesto]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la tasa de impuesto
 *     responses:
 *       200:
 *         description: Tasa encontrada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Tasa no encontrada
 */
router.get('/:id', auth, authz('products.view'),    controller.getById);

/**
 * @swagger
 * /tax-rates:
 *   post:
 *     summary: Crear tasa de impuesto
 *     tags: [Tasas de Impuesto]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - percentage
 *               - effective_from
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre de la tasa
 *               percentage:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 1
 *                 description: "Porcentaje (ej: 0.15)"
 *               effective_from:
 *                 type: string
 *                 format: date
 *                 description: Fecha de inicio de vigencia
 *               effective_until:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 description: Fecha de fin de vigencia
 *               sri_code:
 *                 type: string
 *                 description: Código SRI
 *               sri_percentage_code:
 *                 type: string
 *                 description: Código de porcentaje SRI
 *               description:
 *                 type: string
 *                 description: Descripción
 *     responses:
 *       201:
 *         description: Tasa creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.post('/',   auth, authz('settings.manage'),  validate(createRules), controller.create);

/**
 * @swagger
 * /tax-rates/{id}:
 *   put:
 *     summary: Actualizar tasa de impuesto
 *     tags: [Tasas de Impuesto]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la tasa de impuesto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre de la tasa
 *               percentage:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 1
 *                 description: Porcentaje
 *               effective_from:
 *                 type: string
 *                 format: date
 *                 description: Fecha de inicio de vigencia
 *               effective_until:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 description: Fecha de fin de vigencia
 *               is_active:
 *                 type: boolean
 *                 description: Estado activo
 *     responses:
 *       200:
 *         description: Tasa actualizada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Tasa no encontrada
 */
router.put('/:id', auth, authz('settings.manage'),  validate(updateRules), controller.update);

module.exports = router;
