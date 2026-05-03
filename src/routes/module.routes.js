'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/module.controller');
const authenticate = require('../middlewares/authenticate');
const { requirePlatform } = require('../middlewares/platformAuth');

/**
 * @swagger
 * tags:
 *   name: Modules
 *   description: Catálogo de módulos del ERP
 */

/**
 * @swagger
 * /modules/public:
 *   get:
 *     summary: Listar módulos disponibles (sin autenticación, para onboarding)
 *     tags: [Modules]
 *     security: []
 *     responses:
 *       200:
 *         description: Catálogo público de módulos
 */

/**
 * @swagger
 * /modules/active:
 *   get:
 *     summary: Listar módulos activos de la tienda autenticada
 *     tags: [Modules]
 *     responses:
 *       200:
 *         description: Módulos activos con estado de solicitud pendiente
 */

/**
 * @swagger
 * /modules/company-catalog:
 *   get:
 *     summary: Catálogo de módulos con estado de contratación de la empresa
 *     tags: [Modules]
 *     responses:
 *       200:
 *         description: Módulos con indicador de activo/inactivo para la empresa
 */

/**
 * @swagger
 * /modules:
 *   get:
 *     summary: Listar todos los módulos (PLATFORM)
 *     tags: [Modules]
 *     responses:
 *       200:
 *         description: Lista completa de módulos
 */

/**
 * @swagger
 * /modules/{id}:
 *   get:
 *     summary: Obtener módulo por ID (PLATFORM)
 *     tags: [Modules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Datos del módulo
 *       404:
 *         description: No encontrado
 */

// Público: catálogo visible para onboarding
router.get('/public', controller.listPublic);

// Tienda: sus módulos activos (con/sin solicitud pendiente)
router.get('/active',           authenticate, controller.listActive);
router.get('/company-catalog',  authenticate, controller.getCompanyCatalog);

// Admin de plataforma: ve todos los módulos
router.get('/',       authenticate, requirePlatform, controller.listAll);
router.get('/:id',    authenticate, requirePlatform, controller.getById);

module.exports = router;
