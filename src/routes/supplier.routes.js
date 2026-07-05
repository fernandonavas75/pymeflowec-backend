'use strict';

const router                 = require('express').Router();
const controller             = require('../controllers/supplier.controller');
const authenticate           = require('../middlewares/authenticate');
const platformStoreAccess    = require('../middlewares/platformStoreAccess');
const { checkModuleExpiry }  = require('../middlewares/checkModuleExpiry');
const validate               = require('../middlewares/validate');
const { createRules, updateRules } = require('../validators/supplier.validators');

/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: Proveedores de la tienda (MOD_PARAMS)
 */

/**
 * @swagger
 * /suppliers:
 *   get:
 *     summary: Listar proveedores
 *     tags: [Suppliers]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Buscar por nombre o RUC
 *     responses:
 *       200:
 *         description: Lista de proveedores
 *   post:
 *     summary: Crear proveedor (STORE_ADMIN)
 *     tags: [Suppliers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:           { type: string }
 *               ruc:            { type: string }
 *               contact_name:   { type: string }
 *               email:          { type: string, format: email }
 *               phone:          { type: string }
 *               address:        { type: string }
 *     responses:
 *       201:
 *         description: Proveedor creado
 */

/**
 * @swagger
 * /suppliers/{id}:
 *   get:
 *     summary: Obtener proveedor por ID
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Datos del proveedor
 *       404:
 *         description: No encontrado
 *   put:
 *     summary: Actualizar proveedor (STORE_ADMIN)
 *     tags: [Suppliers]
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
 *               name:         { type: string }
 *               contact_name: { type: string }
 *               email:        { type: string, format: email }
 *               phone:        { type: string }
 *               address:      { type: string }
 *     responses:
 *       200:
 *         description: Proveedor actualizado
 *   delete:
 *     summary: Eliminar proveedor (STORE_ADMIN)
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Proveedor eliminado
 */

router.use(authenticate, checkModuleExpiry('MOD_PARAMS'));

router.get('/',       platformStoreAccess('STORE'),        controller.list);
router.get('/:id',    platformStoreAccess('STORE'),        controller.getById);
router.post('/',      platformStoreAccess('STORE_ADMIN'),  validate(createRules),  controller.create);
router.put('/:id',    platformStoreAccess('STORE_ADMIN'),  validate(updateRules),  controller.update);
router.delete('/:id', platformStoreAccess('STORE_ADMIN'),  controller.remove);

module.exports = router;
