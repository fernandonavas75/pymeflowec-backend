'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/user.controller');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');

router.get('/',    authenticate, authorize('STORE_ADMIN'), controller.list);
router.get('/:id', authenticate, authorize('STORE_ADMIN'), controller.getById);
router.post('/',   authenticate, authorize('STORE_ADMIN'), controller.create);
router.put('/:id', authenticate, authorize('STORE_ADMIN'), controller.update);

router.patch('/:id/activate',        authenticate, authorize('STORE_ADMIN'), controller.activate);
router.patch('/:id/deactivate',      authenticate, authorize('STORE_ADMIN'), controller.deactivate);
router.patch('/:id/lock',            authenticate, authorize('STORE_ADMIN'), controller.lock);
router.patch('/:id/change-password', authenticate, controller.changePassword);
router.delete('/:id',                authenticate, authorize('STORE_ADMIN'), controller.remove);

module.exports = router;
