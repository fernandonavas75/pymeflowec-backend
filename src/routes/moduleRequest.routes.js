'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/moduleRequest.controller');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');
const { requirePlatformStaff, requirePlatformWrite } = require('../middlewares/platformAuth');
const validate     = require('../middlewares/validate');
const { createRequest, reviewStatus, rejectRequest } = require('../validators/moduleRequest.validators');

/**
 * @swagger
 * tags:
 *   name: Módulos - Solicitudes
 *   description: Solicitudes de activación de módulos por organización
 */

/**
 * @swagger
 * /module-requests:
 *   get:
 *     summary: Listar solicitudes de la propia organización
 *     tags: [Módulos - Solicitudes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, cancelled]
 *     responses:
 *       200:
 *         description: Lista de solicitudes
 */
router.get('/',
  authenticate,
  authorize('modules.view'),
  validate(reviewStatus),
  controller.list
);

/**
 * @swagger
 * /module-requests/all:
 *   get:
 *     summary: Listar solicitudes de todas las organizaciones (solo platform staff)
 *     tags: [Módulos - Solicitudes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas las solicitudes
 */
router.get('/all',
  authenticate,
  requirePlatformStaff,
  validate(reviewStatus),
  controller.listAll
);

/**
 * @swagger
 * /module-requests:
 *   post:
 *     summary: Crear solicitud de activación de módulo
 *     tags: [Módulos - Solicitudes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [module_id]
 *             properties:
 *               module_id:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Solicitud creada
 *       409:
 *         description: Ya existe una solicitud pendiente
 */
router.post('/',
  authenticate,
  authorize('modules.request'),
  validate(createRequest),
  controller.create
);

/**
 * @swagger
 * /module-requests/{id}/approve:
 *   patch:
 *     summary: Aprobar solicitud (solo platform admin con can_write)
 *     tags: [Módulos - Solicitudes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Solicitud aprobada
 */
router.patch('/:id/approve',
  authenticate,
  requirePlatformStaff,
  requirePlatformWrite,
  controller.approve
);

/**
 * @swagger
 * /module-requests/{id}/reject:
 *   patch:
 *     summary: Rechazar solicitud (solo platform admin con can_write)
 *     tags: [Módulos - Solicitudes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Solicitud rechazada
 */
router.patch('/:id/reject',
  authenticate,
  requirePlatformStaff,
  requirePlatformWrite,
  validate(rejectRequest),
  controller.reject
);

/**
 * @swagger
 * /module-requests/{id}/cancel:
 *   patch:
 *     summary: Cancelar solicitud propia
 *     tags: [Módulos - Solicitudes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Solicitud cancelada
 */
router.patch('/:id/cancel',
  authenticate,
  authorize('modules.request'),
  controller.cancel
);

module.exports = router;
