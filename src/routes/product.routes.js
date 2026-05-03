'use strict';

const router                 = require('express').Router();
const controller             = require('../controllers/product.controller');
const authenticate           = require('../middlewares/authenticate');
const platformStoreAccess    = require('../middlewares/platformStoreAccess');
const validate               = require('../middlewares/validate');
const { bulkCreateRules }    = require('../validators/product.validators');
const { checkModuleExpiry }  = require('../middlewares/checkModuleExpiry');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Catálogo de productos (MOD_PRODUCTS)
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Listar productos de la tienda
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: active
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Lista de productos
 *   post:
 *     summary: Crear producto (STORE_ADMIN)
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name:        { type: string }
 *               description: { type: string }
 *               price:       { type: number }
 *               cost:        { type: number }
 *               sku:         { type: string }
 *               stock:       { type: integer }
 *               tax_rate_id: { type: integer }
 *     responses:
 *       201:
 *         description: Producto creado
 */

/**
 * @swagger
 * /products/bulk:
 *   post:
 *     summary: Crear múltiples productos (STORE_ADMIN)
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [products]
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [name, price]
 *                   properties:
 *                     name:  { type: string }
 *                     price: { type: number }
 *     responses:
 *       201:
 *         description: Productos creados en lote
 */

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Obtener producto por ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Datos del producto
 *       404:
 *         description: No encontrado
 *   put:
 *     summary: Actualizar producto (STORE_ADMIN)
 *     tags: [Products]
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
 *               name:        { type: string }
 *               description: { type: string }
 *               price:       { type: number }
 *               cost:        { type: number }
 *               sku:         { type: string }
 *               tax_rate_id: { type: integer }
 *     responses:
 *       200:
 *         description: Producto actualizado
 *   delete:
 *     summary: Eliminar producto (STORE_ADMIN)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Producto eliminado
 */

/**
 * @swagger
 * /products/{id}/stock:
 *   patch:
 *     summary: Ajustar stock del producto (STORE_ADMIN o STORE_WAREHOUSE, requiere MOD_INVENTORY)
 *     tags: [Products]
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
 *             required: [quantity, type]
 *             properties:
 *               quantity: { type: integer }
 *               type:     { type: string, enum: [ENTRADA,SALIDA,AJUSTE] }
 *               notes:    { type: string }
 *     responses:
 *       200:
 *         description: Stock ajustado
 */

/**
 * @swagger
 * /products/{id}/activate:
 *   patch:
 *     summary: Activar producto (STORE_ADMIN)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Producto activado
 */

/**
 * @swagger
 * /products/{id}/deactivate:
 *   patch:
 *     summary: Desactivar producto (STORE_ADMIN)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Producto desactivado
 */

router.use(authenticate, checkModuleExpiry('MOD_PRODUCTS'));

// /bulk debe ir antes de /:id para que Express no lo interprete como un ID
router.post('/bulk', platformStoreAccess('STORE_ADMIN'), validate(bulkCreateRules), controller.bulkCreate);

router.get('/',    platformStoreAccess('STORE'),        controller.list);
router.get('/:id', platformStoreAccess('STORE'),        controller.getById);
router.post('/',   platformStoreAccess('STORE_ADMIN'),  controller.create);
router.put('/:id', platformStoreAccess('STORE_ADMIN'),  controller.update);

// Stock requiere también MOD_INVENTORY además de MOD_PRODUCTS
router.patch('/:id/stock',      checkModuleExpiry('MOD_INVENTORY'), platformStoreAccess('STORE_ADMIN', 'STORE_WAREHOUSE'), controller.adjustStock);
router.patch('/:id/activate',   platformStoreAccess('STORE_ADMIN'), controller.activate);
router.patch('/:id/deactivate', platformStoreAccess('STORE_ADMIN'), controller.deactivate);
router.delete('/:id',           platformStoreAccess('STORE_ADMIN'), controller.remove);

module.exports = router;
