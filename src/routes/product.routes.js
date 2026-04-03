'use strict';

const router     = require('express').Router();
const controller = require('../controllers/product.controller');
const auth       = require('../middlewares/authenticate');
const authz      = require('../middlewares/authorize');
const validate   = require('../middlewares/validate');
const { createRules, updateRules, adjustStockRules } = require('../validators/product.validators');

/**
 * @swagger
 * tags:
 *   name: Productos
 *   description: Gestión de productos
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Obtener lista de productos
 *     tags: [Productos]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: ID de categoría
 *     responses:
 *       200:
 *         description: Lista de productos obtenida exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.get('/',    auth, authz('products.view'),   controller.list);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Obtener producto por ID
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Producto no encontrado
 */
router.get('/:id', auth, authz('products.view'),   controller.getById);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Crear producto
 *     tags: [Productos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - unit_price
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del producto
 *               unit_price:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Precio unitario
 *               cost_price:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Precio de costo
 *               stock:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Stock inicial
 *               min_stock:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Stock mínimo
 *               unit:
 *                 type: string
 *                 enum: [unidad, kg, lb, litro, metro, paquete, caja, docena, funda]
 *                 description: Unidad de medida
 *               category_id:
 *                 type: integer
 *                 nullable: true
 *                 minimum: 1
 *                 description: ID de categoría
 *               tax_rate_id:
 *                 type: integer
 *                 nullable: true
 *                 minimum: 1
 *                 description: ID de tasa de impuesto
 *               barcode:
 *                 type: string
 *                 description: Código de barras
 *               sku:
 *                 type: string
 *                 description: SKU
 *               description:
 *                 type: string
 *                 description: Descripción
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.post('/',   auth, authz('products.create'), validate(createRules), controller.create);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Actualizar producto
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del producto
 *               unit_price:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Precio unitario
 *               cost_price:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Precio de costo
 *               min_stock:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Stock mínimo
 *               unit:
 *                 type: string
 *                 enum: [unidad, kg, lb, litro, metro, paquete, caja, docena, funda]
 *                 description: Unidad de medida
 *               category_id:
 *                 type: integer
 *                 nullable: true
 *                 minimum: 1
 *                 description: ID de categoría
 *               tax_rate_id:
 *                 type: integer
 *                 nullable: true
 *                 minimum: 1
 *                 description: ID de tasa de impuesto
 *               barcode:
 *                 type: string
 *                 description: Código de barras
 *               sku:
 *                 type: string
 *                 description: SKU
 *               description:
 *                 type: string
 *                 description: Descripción
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Producto no encontrado
 */
router.put('/:id', auth, authz('products.edit'),   validate(updateRules), controller.update);

/**
 * @swagger
 * /products/{id}/stock:
 *   patch:
 *     summary: Ajustar stock de producto
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *               - movement_type
 *             properties:
 *               quantity:
 *                 type: number
 *                 format: float
 *                 description: Cantidad a ajustar
 *               movement_type:
 *                 type: string
 *                 enum: [in, out, adjustment]
 *                 description: Tipo de movimiento
 *               reason:
 *                 type: string
 *                 description: Razón del ajuste
 *     responses:
 *       200:
 *         description: Stock ajustado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Producto no encontrado
 */
router.patch('/:id/stock',      auth, authz('inventory.adjust'), validate(adjustStockRules), controller.adjustStock);

/**
 * @swagger
 * /products/{id}/activate:
 *   patch:
 *     summary: Activar producto
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto activado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Producto no encontrado
 */
router.patch('/:id/activate',   auth, authz('products.edit'),    controller.activate);

/**
 * @swagger
 * /products/{id}/deactivate:
 *   patch:
 *     summary: Desactivar producto
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto desactivado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Producto no encontrado
 */
router.patch('/:id/deactivate', auth, authz('products.edit'),    controller.deactivate);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Eliminar producto
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Producto no encontrado
 */
router.delete('/:id',           auth, authz('products.delete'),  controller.remove);

module.exports = router;
