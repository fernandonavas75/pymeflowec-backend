'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/company.controller');
const authenticate = require('../middlewares/authenticate');
const { requirePlatformAdmin } = require('../middlewares/platformAuth');

// Solo PLATFORM_ADMIN gestiona empresas
router.get('/',               authenticate, requirePlatformAdmin, controller.list);
router.get('/:id',            authenticate, requirePlatformAdmin, controller.getById);
router.post('/',              authenticate, requirePlatformAdmin, controller.create);
router.put('/:id',            authenticate, requirePlatformAdmin, controller.update);
router.patch('/:id/activate',   authenticate, requirePlatformAdmin, controller.activate);
router.patch('/:id/deactivate', authenticate, requirePlatformAdmin, controller.deactivate);
router.patch('/:id/suspend',    authenticate, requirePlatformAdmin, controller.suspend);

module.exports = router;
