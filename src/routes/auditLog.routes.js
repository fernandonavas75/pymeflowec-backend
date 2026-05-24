'use strict';

const router                = require('express').Router();
const controller            = require('../controllers/auditLog.controller');
const authenticate          = require('../middlewares/authenticate');
const { requirePlatform }   = require('../middlewares/platformAuth');
const platformStoreAccess   = require('../middlewares/platformStoreAccess');
const { checkModuleExpiry } = require('../middlewares/checkModuleExpiry');

/**
 * @swagger
 * tags:
 *   name: AuditLogs
 *   description: Registros de auditoría del sistema
 */

/**
 * @swagger
 * /audit-logs:
 *   get:
 *     summary: Lista registros de auditoría (solo PLATFORM)
 *     tags: [AuditLogs]
 *     parameters:
 *       - in: query
 *         name: company_id
 *         schema: { type: integer }
 *       - in: query
 *         name: action
 *         schema: { type: string, enum: [INSERT, UPDATE, DELETE] }
 *       - in: query
 *         name: table_name
 *         schema: { type: string }
 *       - in: query
 *         name: date_from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: date_to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Lista paginada de registros de auditoría
 */
router.get('/', authenticate, requirePlatform, controller.list);

/**
 * @swagger
 * /audit-logs/my-company:
 *   get:
 *     summary: Actividad de la empresa del usuario autenticado (STORE_ADMIN)
 *     description: >
 *       Devuelve los registros de auditoría filtrados automáticamente por la
 *       empresa del token JWT. El company_id no puede ser sobreescrito por el
 *       cliente — siempre se usa el del usuario autenticado.
 *       También accesible por PLATFORM_ADMIN en modo cliente (?company_id=X).
 *     tags: [AuditLogs]
 *     parameters:
 *       - in: query
 *         name: action
 *         schema: { type: string, enum: [INSERT, UPDATE, DELETE] }
 *       - in: query
 *         name: table_name
 *         schema: { type: string }
 *       - in: query
 *         name: date_from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: date_to
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 40 }
 *     responses:
 *       200:
 *         description: Lista paginada de actividad de la empresa
 */
router.get('/my-company', authenticate, checkModuleExpiry('MOD_PARAMS'), platformStoreAccess('STORE_ADMIN'), controller.listMyCompany);

module.exports = router;
