'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/auditLog.controller');
const authenticate = require('../middlewares/authenticate');
const { requirePlatform } = require('../middlewares/platformAuth');

/**
 * @swagger
 * /audit-logs:
 *   get:
 *     summary: Lista registros de auditoría (solo plataforma)
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
 */
router.get('/', authenticate, requirePlatform, controller.list);

module.exports = router;
