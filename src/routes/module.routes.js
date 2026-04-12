'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/module.controller');
const authenticate = require('../middlewares/authenticate');
const { requirePlatform } = require('../middlewares/platformAuth');

// Público: catálogo visible para onboarding
router.get('/public', controller.listPublic);

// Tienda: sus módulos activos (con/sin solicitud pendiente)
router.get('/active',           authenticate, controller.listActive);
router.get('/company-catalog',  authenticate, controller.getCompanyCatalog);

// Admin de plataforma: ve todos los módulos
router.get('/',       authenticate, requirePlatform, controller.listAll);
router.get('/:id',    authenticate, requirePlatform, controller.getById);

module.exports = router;
