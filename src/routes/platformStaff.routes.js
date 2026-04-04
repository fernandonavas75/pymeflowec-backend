'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/platformStaff.controller');
const authenticate = require('../middlewares/authenticate');
const { requirePlatformStaff, requirePlatformWrite } = require('../middlewares/platformAuth');
const validate     = require('../middlewares/validate');
const { assign: assignRules } = require('../validators/platformStaff.validators');

/**
 * @swagger
 * tags:
 *   name: Plataforma - Staff
 *   description: Gestión de usuarios internos con acceso cross-tenant
 */

/**
 * @swagger
 * /platform/staff/roles:
 *   get:
 *     summary: Listar roles de plataforma disponibles
 *     tags: [Plataforma - Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles de plataforma
 */
router.get('/roles',
  authenticate,
  requirePlatformStaff,
  controller.listRoles
);

/**
 * @swagger
 * /platform/staff:
 *   get:
 *     summary: Listar todo el staff de plataforma
 *     tags: [Plataforma - Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de staff
 */
router.get('/',
  authenticate,
  requirePlatformStaff,
  controller.list
);

/**
 * @swagger
 * /platform/staff:
 *   post:
 *     summary: Asignar usuario como staff de plataforma
 *     tags: [Plataforma - Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, platform_role_id]
 *             properties:
 *               user_id:
 *                 type: integer
 *               platform_role_id:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Staff asignado
 */
router.post('/',
  authenticate,
  requirePlatformStaff,
  requirePlatformWrite,
  validate(assignRules),
  controller.assign
);

/**
 * @swagger
 * /platform/staff/{id}/revoke:
 *   patch:
 *     summary: Revocar acceso de staff de plataforma
 *     tags: [Plataforma - Staff]
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
 *         description: Acceso revocado
 */
router.patch('/:id/revoke',
  authenticate,
  requirePlatformStaff,
  requirePlatformWrite,
  controller.revoke
);

module.exports = router;
