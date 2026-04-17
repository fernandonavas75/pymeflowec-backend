'use strict';

const router               = require('express').Router();
const controller           = require('../controllers/storeCustomer.controller');
const authenticate         = require('../middlewares/authenticate');
const authorize            = require('../middlewares/authorize');
const platformStoreAccess  = require('../middlewares/platformStoreAccess');

// STORE_ADMIN y STORE_SELLER pueden ver/crear clientes
router.get('/',    authenticate, platformStoreAccess('STORE'),       controller.list);
router.get('/:id', authenticate, platformStoreAccess('STORE'),       controller.getById);
router.post('/',   authenticate, platformStoreAccess('STORE'),       controller.create);
router.put('/:id', authenticate, platformStoreAccess('STORE_ADMIN'), controller.update);
router.delete('/:id', authenticate, platformStoreAccess('STORE_ADMIN'), controller.remove);

module.exports = router;
