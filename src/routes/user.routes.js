'use strict';

const router               = require('express').Router();
const controller           = require('../controllers/user.controller');
const authenticate         = require('../middlewares/authenticate');
const authorize            = require('../middlewares/authorize');
const platformStoreAccess  = require('../middlewares/platformStoreAccess');

// Rutas públicas (sin autenticación)
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password',  controller.resetPassword);

// Rutas protegidas
router.get('/',    authenticate, platformStoreAccess('STORE_ADMIN'), controller.list);
router.get('/:id', authenticate, platformStoreAccess('STORE_ADMIN'), controller.getById);
// PLATFORM_ADMIN puede crear usuarios para cualquier empresa (pasa company_id en el body)
router.post('/',   authenticate, authorize('STORE_ADMIN', 'PLATFORM'), controller.create);
router.put('/:id', authenticate, platformStoreAccess('STORE_ADMIN'), controller.update);

router.patch('/:id/activate',        authenticate, platformStoreAccess('STORE_ADMIN'), controller.activate);
router.patch('/:id/deactivate',      authenticate, platformStoreAccess('STORE_ADMIN'), controller.deactivate);
router.patch('/:id/lock',            authenticate, platformStoreAccess('STORE_ADMIN'), controller.lock);
router.patch('/:id/change-password', authenticate, controller.changePassword);
router.delete('/:id',                authenticate, platformStoreAccess('STORE_ADMIN'), controller.remove);

module.exports = router;
