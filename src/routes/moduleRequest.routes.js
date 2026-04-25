'use strict';

const router               = require('express').Router();
const controller           = require('../controllers/moduleRequest.controller');
const authenticate         = require('../middlewares/authenticate');
const authorize            = require('../middlewares/authorize');
const { requirePlatform, requirePlatformAdmin } = require('../middlewares/platformAuth');
const platformStoreAccess  = require('../middlewares/platformStoreAccess');

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
