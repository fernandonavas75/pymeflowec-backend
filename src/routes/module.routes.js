'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/module.controller');
const authenticate = require('../middlewares/authenticate');
const { requirePlatform } = require('../middlewares/platformAuth');

// Público: catálogo visible para onboarding
router.get('/public', controller.listPublic);

// Admin de plataforma: ve todos los módulos
router.get('/',       authenticate, requirePlatform, controller.listAll);
router.get('/:id',    authenticate, requirePlatform, controller.getById);

// Tienda: sus módulos activos
router.get('/active', authenticate, controller.listActive);

module.exports = router;
