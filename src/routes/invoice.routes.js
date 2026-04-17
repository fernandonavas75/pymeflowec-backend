'use strict';

const router               = require('express').Router();
const controller           = require('../controllers/invoice.controller');
const authenticate         = require('../middlewares/authenticate');
const authorize            = require('../middlewares/authorize');
const platformStoreAccess  = require('../middlewares/platformStoreAccess');

router.get('/',    authenticate, platformStoreAccess('STORE'),       controller.list);
router.get('/:id', authenticate, platformStoreAccess('STORE'),       controller.getById);
router.post('/',   authenticate, platformStoreAccess('STORE_ADMIN', 'STORE_SELLER'), controller.create);
router.patch('/:id/cancel', authenticate, platformStoreAccess('STORE_ADMIN'), controller.cancel);

module.exports = router;
