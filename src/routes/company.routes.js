'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/company.controller');
const authenticate = require('../middlewares/authenticate');
const { requirePlatform, requirePlatformAdmin } = require('../middlewares/platformAuth');

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Gestión de empresas (solo PLATFORM)
 */

/**
 * @swagger
 * /companies:
 *   get:
 *     summary: Listar todas las empresas
 *     tags: [Companies]
 *     responses:
 *       200:
 *         description: Lista de empresas
 *   post:
 *     summary: Crear empresa (PLATFORM_ADMIN)
 *     tags: [Companies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, ruc]
 *             properties:
 *               name:    { type: string }
 *               ruc:     { type: string }
 *               address: { type: string }
 *               phone:   { type: string }
 *               email:   { type: string, format: email }
 *     responses:
 *       201:
 *         description: Empresa creada
 */

/**
 * @swagger
 * /companies/{id}:
 *   get:
 *     summary: Obtener empresa por ID
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Datos de la empresa
 *       404:
 *         description: No encontrada
 *   put:
 *     summary: Actualizar empresa (PLATFORM_ADMIN)
 *     tags: [Companies]
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
 *               address: { type: string }
 *               phone:   { type: string }
 *               email:   { type: string, format: email }
 *     responses:
 *       200:
 *         description: Empresa actualizada
 */

/**
 * @swagger
 * /companies/{id}/activate:
 *   patch:
 *     summary: Activar empresa (PLATFORM_ADMIN)
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Empresa activada
 */

/**
 * @swagger
 * /companies/{id}/deactivate:
 *   patch:
 *     summary: Desactivar empresa (PLATFORM_ADMIN)
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Empresa desactivada
 */

/**
 * @swagger
 * /companies/{id}/suspend:
 *   patch:
 *     summary: Suspender empresa (PLATFORM_ADMIN)
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Empresa suspendida
 */

// Lectura: cualquier usuario de plataforma; escritura: solo PLATFORM_ADMIN
router.get('/',               authenticate, requirePlatform,      controller.list);
router.get('/:id',            authenticate, requirePlatform,      controller.getById);
router.post('/',              authenticate, requirePlatformAdmin, controller.create);
router.put('/:id',            authenticate, requirePlatformAdmin, controller.update);
router.patch('/:id/activate',   authenticate, requirePlatformAdmin, controller.activate);
router.patch('/:id/deactivate', authenticate, requirePlatformAdmin, controller.deactivate);
router.patch('/:id/suspend',    authenticate, requirePlatformAdmin, controller.suspend);

module.exports = router;
