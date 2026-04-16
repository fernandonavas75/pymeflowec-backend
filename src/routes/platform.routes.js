'use strict';

const router       = require('express').Router();
const userCtrl     = require('../controllers/platformUser.controller');
const authenticate = require('../middlewares/authenticate');
const { requirePlatformAdmin } = require('../middlewares/platformAuth');

/**
 * Rutas exclusivas para PLATFORM_ADMIN.
 * Prefijo registrado en app.js: /api/platform
 */

// ── Usuarios de soporte ──────────────────────────────────────────────
/**
 * @swagger
 * /platform/users:
 *   get:
 *     summary: Lista usuarios de plataforma (PLATFORM_ADMIN)
 *     tags: [Platform]
 */
router.get('/users',                    authenticate, requirePlatformAdmin, userCtrl.list);
router.patch('/users/:id/activate',     authenticate, requirePlatformAdmin, userCtrl.activate);
router.patch('/users/:id/deactivate',   authenticate, requirePlatformAdmin, userCtrl.deactivate);
router.patch('/users/:id/lock',         authenticate, requirePlatformAdmin, userCtrl.lock);

module.exports = router;
