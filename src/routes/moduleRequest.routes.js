'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/moduleRequest.controller');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');
const { requirePlatformAdmin } = require('../middlewares/platformAuth');

// Tienda: lista y crea sus propias solicitudes
router.get('/',    authenticate, authorize('STORE_ADMIN'), controller.list);
router.post('/',   authenticate, authorize('STORE_ADMIN'), controller.create);

// Plataforma: ve todas las solicitudes y las gestiona
router.get('/all',          authenticate, requirePlatformAdmin, controller.listAll);
router.patch('/:id/approve', authenticate, requirePlatformAdmin, controller.approve);
router.patch('/:id/reject',  authenticate, requirePlatformAdmin, controller.reject);

module.exports = router;
