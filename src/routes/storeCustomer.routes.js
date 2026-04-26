'use strict';

const router                 = require('express').Router();
const controller             = require('../controllers/storeCustomer.controller');
const authenticate           = require('../middlewares/authenticate');
const platformStoreAccess    = require('../middlewares/platformStoreAccess');
const { checkModuleExpiry }  = require('../middlewares/checkModuleExpiry');

router.use(authenticate, checkModuleExpiry('MOD_INVOICING'));

router.get('/',       platformStoreAccess('STORE'),        controller.list);
router.get('/:id',    platformStoreAccess('STORE'),        controller.getById);
router.post('/',      platformStoreAccess('STORE'),        controller.create);
router.put('/:id',    platformStoreAccess('STORE_ADMIN'),  controller.update);
router.delete('/:id', platformStoreAccess('STORE_ADMIN'),  controller.remove);

module.exports = router;
