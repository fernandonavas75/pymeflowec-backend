'use strict';

const router               = require('express').Router();
const controller           = require('../controllers/moduleRequest.controller');
const authenticate         = require('../middlewares/authenticate');
const authorize            = require('../middlewares/authorize');
const { requirePlatform, requirePlatformAdmin } = require('../middlewares/platformAuth');
const platformStoreAccess  = require('../middlewares/platformStoreAccess');

/**
 * @swagger
 * tags:
 *   name: ModuleRequests
 *   description: Solicitudes de activación de módulos
 */

/**
 * @swagger
 * /module-requests:
 *   get:
 *     summary: Listar solicitudes de la tienda (STORE_ADMIN)
 *     tags: [ModuleRequests]
 *     responses:
 *       200:
 *         description: Solicitudes de la tienda autenticada
 *   post:
 *     summary: Crear solicitud de activación de módulo (STORE_ADMIN)
 *     tags: [ModuleRequests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [module_id]
 *             properties:
 *               module_id: { type: integer }
 *               notes:     { type: string }
 *     responses:
 *       201:
 *         description: Solicitud creada
 */

/**
 * @swagger
 * /module-requests/all:
 *   get:
 *     summary: Listar todas las solicitudes (PLATFORM)
 *     tags: [ModuleRequests]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDIENTE,APROBADA,RECHAZADA,REVOCADA] }
 *     responses:
 *       200:
 *         description: Todas las solicitudes del sistema
 */

/**
 * @swagger
 * /module-requests/{id}/approve:
 *   patch:
 *     summary: Aprobar solicitud (PLATFORM_ADMIN)
 *     tags: [ModuleRequests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Solicitud aprobada y módulo activado
 */

/**
 * @swagger
 * /module-requests/{id}/reject:
 *   patch:
 *     summary: Rechazar solicitud (PLATFORM_ADMIN)
 *     tags: [ModuleRequests]
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
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Solicitud rechazada
 */

/**
 * @swagger
 * /module-requests/{id}/revoke:
 *   patch:
 *     summary: Revocar módulo activo por solicitud (PLATFORM_ADMIN)
 *     tags: [ModuleRequests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Módulo revocado
 */

/**
 * @swagger
 * /module-requests/revoke-module:
 *   patch:
 *     summary: Revocar módulo por código de módulo (PLATFORM_ADMIN)
 *     tags: [ModuleRequests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [store_id, module_code]
 *             properties:
 *               store_id:    { type: integer }
 *               module_code: { type: string }
 *     responses:
 *       200:
 *         description: Módulo revocado
 */

// Tienda: lista y crea sus propias solicitudes
router.get('/',  authenticate, platformStoreAccess('STORE_ADMIN'), controller.list);
router.post('/', authenticate, platformStoreAccess('STORE_ADMIN'), controller.create);

// Plataforma: ve todas las solicitudes (soporte puede leer); solo admin gestiona
router.get('/all',           authenticate, requirePlatform,      controller.listAll);
router.patch('/:id/approve', authenticate, requirePlatformAdmin, controller.approve);
router.patch('/:id/reject',  authenticate, requirePlatformAdmin, controller.reject);
router.patch('/:id/revoke',      authenticate, requirePlatformAdmin, controller.revoke);
router.patch('/revoke-module',   authenticate, requirePlatformAdmin, controller.revokeByModule);

module.exports = router;
