'use strict';

const router                 = require('express').Router();
const controller             = require('../controllers/invoice.controller');
const authenticate           = require('../middlewares/authenticate');
const platformStoreAccess    = require('../middlewares/platformStoreAccess');
const { checkModuleExpiry }  = require('../middlewares/checkModuleExpiry');

router.use(authenticate, checkModuleExpiry('MOD_INVOICING'));

router.get('/',             platformStoreAccess('STORE'),                        controller.list);
router.get('/:id',          platformStoreAccess('STORE'),                        controller.getById);
router.post('/',            platformStoreAccess('STORE_ADMIN', 'STORE_SELLER'),  controller.create);
router.patch('/:id/cancel', platformStoreAccess('STORE_ADMIN'),                  controller.cancel);

module.exports = router;
