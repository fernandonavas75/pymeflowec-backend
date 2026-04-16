'use strict';

const router       = require('express').Router();
const userCtrl     = require('../controllers/platformUser.controller');
const authenticate = require('../middlewares/authenticate');
const { requirePlatform, requirePlatformAdmin } = require('../middlewares/platformAuth');

/**
 * Rutas de plataforma.
 * Prefijo registrado en app.js: /api/platform
 */

// ── Usuarios de soporte (solo PLATFORM_ADMIN puede gestionar) ────────
router.get('/users',                    authenticate, requirePlatformAdmin, userCtrl.list);
router.patch('/users/:id/activate',     authenticate, requirePlatformAdmin, userCtrl.activate);
router.patch('/users/:id/deactivate',   authenticate, requirePlatformAdmin, userCtrl.deactivate);
router.patch('/users/:id/lock',         authenticate, requirePlatformAdmin, userCtrl.lock);

// ── Usuarios de empresa — solo lectura, cualquier usuario de plataforma ─
router.get('/companies/:id/users',      authenticate, requirePlatform, userCtrl.listByCompany);

module.exports = router;
