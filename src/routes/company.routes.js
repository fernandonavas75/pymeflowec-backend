'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/company.controller');
const authenticate = require('../middlewares/authenticate');
const { requirePlatform, requirePlatformAdmin } = require('../middlewares/platformAuth');

// Lectura: cualquier usuario de plataforma; escritura: solo PLATFORM_ADMIN
router.get('/',               authenticate, requirePlatform,      controller.list);
router.get('/:id',            authenticate, requirePlatform,      controller.getById);
router.post('/',              authenticate, requirePlatformAdmin, controller.create);
router.put('/:id',            authenticate, requirePlatformAdmin, controller.update);
router.patch('/:id/activate',   authenticate, requirePlatformAdmin, controller.activate);
router.patch('/:id/deactivate', authenticate, requirePlatformAdmin, controller.deactivate);
router.patch('/:id/suspend',    authenticate, requirePlatformAdmin, controller.suspend);

module.exports = router;
