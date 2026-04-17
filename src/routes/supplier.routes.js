'use strict';

const router               = require('express').Router();
const controller           = require('../controllers/supplier.controller');
const authenticate         = require('../middlewares/authenticate');
const authorize            = require('../middlewares/authorize');
const platformStoreAccess  = require('../middlewares/platformStoreAccess');

router.get('/',    authenticate, platformStoreAccess('STORE'),       controller.list);
router.get('/:id', authenticate, platformStoreAccess('STORE'),       controller.getById);
router.post('/',   authenticate, platformStoreAccess('STORE_ADMIN'), controller.create);
router.put('/:id', authenticate, platformStoreAccess('STORE_ADMIN'), controller.update);
router.delete('/:id', authenticate, platformStoreAccess('STORE_ADMIN'), controller.remove);

module.exports = router;
