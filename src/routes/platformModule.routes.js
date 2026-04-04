'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/platformModule.controller');
const authenticate = require('../middlewares/authenticate');
const { requirePlatformStaff } = require('../middlewares/platformAuth');

/**
 * @swagger
 * tags:
 *   name: Plataforma - Módulos
 *   description: Catálogo de módulos disponibles en la plataforma
 */

/**
 * @swagger
 * /platform/modules:
 *   get:
 *     summary: Listar todos los módulos disponibles en la plataforma
 *     tags: [Plataforma - Módulos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de módulos
 */
router.get('/',
  authenticate,
  requirePlatformStaff,
  controller.listAll
);

/**
 * @swagger
 * /platform/modules/active:
 *   get:
 *     summary: Listar módulos activos de la organización del usuario autenticado
 *     tags: [Plataforma - Módulos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Módulos activos
 */
router.get('/active',
  authenticate,
  controller.listActive
);

/**
 * @swagger
 * /platform/modules/{id}:
 *   get:
 *     summary: Obtener módulo por ID
 *     tags: [Plataforma - Módulos]
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
 *         description: Módulo encontrado
 *       404:
 *         description: No encontrado
 */
router.get('/:id',
  authenticate,
  requirePlatformStaff,
  controller.getById
);

module.exports = router;
