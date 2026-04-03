'use strict';

const router     = require('express').Router();
const controller = require('../controllers/expense.controller');
const auth       = require('../middlewares/authenticate');
const authz      = require('../middlewares/authorize');
const validate   = require('../middlewares/validate');
const { createRules, createCategoryRules } = require('../validators/expense.validators');

/**
 * @swagger
 * tags:
 *   name: Gastos
 *   description: Gestión de gastos y categorías de gastos
 */

/**
 * @swagger
 * /expenses/categories:
 *   get:
 *     summary: Obtener lista de categorías de gastos
 *     tags: [Gastos]
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
 *         description: Lista de categorías obtenida exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.get('/categories',    auth, authz('expenses.view'),   controller.listCategories);

/**
 * @swagger
 * /expenses/categories:
 *   post:
 *     summary: Crear categoría de gasto
 *     tags: [Gastos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre de la categoría
 *               description:
 *                 type: string
 *                 description: Descripción
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.post('/categories',   auth, authz('expenses.manage'), validate(createCategoryRules), controller.createCategory);

/**
 * @swagger
 * /expenses:
 *   get:
 *     summary: Obtener lista de gastos
 *     tags: [Gastos]
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
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin
 *     responses:
 *       200:
 *         description: Lista de gastos obtenida exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.get('/',              auth, authz('expenses.view'),   controller.list);

/**
 * @swagger
 * /expenses/{id}:
 *   get:
 *     summary: Obtener gasto por ID
 *     tags: [Gastos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del gasto
 *     responses:
 *       200:
 *         description: Gasto encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Gasto no encontrado
 */
router.get('/:id',           auth, authz('expenses.view'),   controller.getById);

/**
 * @swagger
 * /expenses:
 *   post:
 *     summary: Crear gasto
 *     tags: [Gastos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category_id
 *               - amount
 *             properties:
 *               category_id:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID de la categoría
 *               amount:
 *                 type: number
 *                 format: float
 *                 minimum: 0.01
 *                 description: Monto
 *               payment_method:
 *                 type: string
 *                 enum: [cash, transfer, card, other]
 *                 description: Método de pago
 *               expense_date:
 *                 type: string
 *                 format: date
 *                 description: Fecha del gasto
 *               supplier_id:
 *                 type: integer
 *                 nullable: true
 *                 minimum: 1
 *                 description: ID del proveedor
 *               reference_number:
 *                 type: string
 *                 description: Número de referencia
 *               description:
 *                 type: string
 *                 description: Descripción
 *               is_recurring:
 *                 type: boolean
 *                 description: Es recurrente
 *               recurrence_day:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 31
 *                 nullable: true
 *                 description: Día de recurrencia
 *     responses:
 *       201:
 *         description: Gasto creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.post('/',             auth, authz('expenses.create'), validate(createRules), controller.create);

/**
 * @swagger
 * /expenses/{id}/cancel:
 *   patch:
 *     summary: Cancelar gasto
 *     tags: [Gastos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del gasto
 *     responses:
 *       200:
 *         description: Gasto cancelado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Gasto no encontrado
 */
router.patch('/:id/cancel',  auth, authz('expenses.cancel'), controller.cancel);

module.exports = router;
