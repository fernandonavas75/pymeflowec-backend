'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/supplier.controller');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');
const validate     = require('../middlewares/validate');
const { createRules, updateRules } = require('../validators/supplier.validators');

/**
 * @swagger
 * tags:
 *   name: Proveedores
 *   description: Gestión de proveedores de la organización
 */

/**
 * @swagger
 * /suppliers:
 *   get:
 *     summary: Obtener lista de proveedores
 *     tags: [Proveedores]
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
 *     responses:
 *       200:
 *         description: Lista de proveedores obtenida exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.get('/',
  authenticate,
  authorize('suppliers.view'),
  controller.list
);

/**
 * @swagger
 * /suppliers/{id}:
 *   get:
 *     summary: Obtener proveedor por ID
 *     tags: [Proveedores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del proveedor
 *     responses:
 *       200:
 *         description: Proveedor encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Proveedor no encontrado
 */
router.get('/:id',
  authenticate,
  authorize('suppliers.view'),
  controller.getById
);

/**
 * @swagger
 * /suppliers:
 *   post:
 *     summary: Crear proveedor
 *     tags: [Proveedores]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - business_name
 *             properties:
 *               business_name:
 *                 type: string
 *                 description: Razón social
 *               ruc:
 *                 type: string
 *                 minLength: 10
 *                 description: RUC
 *               contact_name:
 *                 type: string
 *                 description: Nombre de contacto
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico
 *               phone:
 *                 type: string
 *                 description: Teléfono
 *               address:
 *                 type: string
 *                 description: Dirección
 *               payment_terms:
 *                 type: string
 *                 description: Términos de pago
 *               notes:
 *                 type: string
 *                 description: Notas
 *     responses:
 *       201:
 *         description: Proveedor creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.post('/',
  authenticate,
  authorize('suppliers.manage'),
  validate(createRules),
  controller.create
);

/**
 * @swagger
 * /suppliers/{id}:
 *   put:
 *     summary: Actualizar proveedor
 *     tags: [Proveedores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del proveedor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               business_name:
 *                 type: string
 *                 description: Razón social
 *               ruc:
 *                 type: string
 *                 minLength: 10
 *                 description: RUC
 *               contact_name:
 *                 type: string
 *                 description: Nombre de contacto
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico
 *               phone:
 *                 type: string
 *                 description: Teléfono
 *               address:
 *                 type: string
 *                 description: Dirección
 *               payment_terms:
 *                 type: string
 *                 description: Términos de pago
 *               notes:
 *                 type: string
 *                 description: Notas
 *     responses:
 *       200:
 *         description: Proveedor actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Proveedor no encontrado
 */
router.put('/:id',
  authenticate,
  authorize('suppliers.manage'),
  validate(updateRules),
  controller.update
);

/**
 * @swagger
 * /suppliers/{id}/activate:
 *   patch:
 *     summary: Activar proveedor
 *     tags: [Proveedores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del proveedor
 *     responses:
 *       200:
 *         description: Proveedor activado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Proveedor no encontrado
 */
router.patch('/:id/activate',
  authenticate,
  authorize('suppliers.manage'),
  controller.activate
);

/**
 * @swagger
 * /suppliers/{id}/deactivate:
 *   patch:
 *     summary: Desactivar proveedor
 *     tags: [Proveedores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del proveedor
 *     responses:
 *       200:
 *         description: Proveedor desactivado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Proveedor no encontrado
 */
router.patch('/:id/deactivate',
  authenticate,
  authorize('suppliers.manage'),
  controller.deactivate
);

/**
 * @swagger
 * /suppliers/{id}:
 *   delete:
 *     summary: Eliminar proveedor
 *     tags: [Proveedores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del proveedor
 *     responses:
 *       200:
 *         description: Proveedor eliminado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Proveedor no encontrado
 */
router.delete('/:id',
  authenticate,
  authorize('suppliers.manage'),
  controller.remove
);

module.exports = router;
