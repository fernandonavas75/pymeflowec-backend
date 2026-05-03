'use strict';

const router                 = require('express').Router();
const controller             = require('../controllers/storeCustomer.controller');
const authenticate           = require('../middlewares/authenticate');
const platformStoreAccess    = require('../middlewares/platformStoreAccess');
const { checkModuleExpiry }  = require('../middlewares/checkModuleExpiry');
const validate               = require('../middlewares/validate');
const { createRules, updateRules } = require('../validators/storeCustomer.validators');

/**
 * @swagger
 * tags:
 *   name: StoreCustomers
 *   description: Clientes de la tienda (MOD_INVOICING)
 */

/**
 * @swagger
 * /store-customers:
 *   get:
 *     summary: Listar clientes de la tienda
 *     tags: [StoreCustomers]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Buscar por nombre, RUC o cédula
 *     responses:
 *       200:
 *         description: Lista de clientes
 *   post:
 *     summary: Crear cliente
 *     tags: [StoreCustomers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, identification]
 *             properties:
 *               name:             { type: string }
 *               identification:   { type: string }
 *               identification_type: { type: string, enum: [RUC,CEDULA,PASAPORTE] }
 *               email:            { type: string, format: email }
 *               phone:            { type: string }
 *               address:          { type: string }
 *     responses:
 *       201:
 *         description: Cliente creado
 */

/**
 * @swagger
 * /store-customers/{id}:
 *   get:
 *     summary: Obtener cliente por ID
 *     tags: [StoreCustomers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Datos del cliente
 *       404:
 *         description: No encontrado
 *   put:
 *     summary: Actualizar cliente (STORE_ADMIN)
 *     tags: [StoreCustomers]
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
 *               name:    { type: string }
 *               email:   { type: string, format: email }
 *               phone:   { type: string }
 *               address: { type: string }
 *     responses:
 *       200:
 *         description: Cliente actualizado
 *   delete:
 *     summary: Eliminar cliente (STORE_ADMIN)
 *     tags: [StoreCustomers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Cliente eliminado
 */

router.use(authenticate, checkModuleExpiry('MOD_INVOICING'));

router.get('/',       platformStoreAccess('STORE'),                                      controller.list);
router.get('/:id',    platformStoreAccess('STORE'),                                      controller.getById);
router.post('/',      platformStoreAccess('STORE'),        validate(createRules),        controller.create);
router.put('/:id',    platformStoreAccess('STORE_ADMIN'),  validate(updateRules),        controller.update);
router.delete('/:id', platformStoreAccess('STORE_ADMIN'),  controller.remove);

module.exports = router;
