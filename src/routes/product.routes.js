'use strict';

const router                 = require('express').Router();
const controller             = require('../controllers/product.controller');
const authenticate           = require('../middlewares/authenticate');
const platformStoreAccess    = require('../middlewares/platformStoreAccess');
const validate               = require('../middlewares/validate');
const { bulkCreateRules }    = require('../validators/product.validators');
const { checkModuleExpiry }  = require('../middlewares/checkModuleExpiry');

router.use(authenticate, checkModuleExpiry('MOD_PRODUCTS'));

// /bulk debe ir antes de /:id para que Express no lo interprete como un ID
router.post('/bulk', platformStoreAccess('STORE_ADMIN'), validate(bulkCreateRules), controller.bulkCreate);

router.get('/',    platformStoreAccess('STORE'),        controller.list);
router.get('/:id', platformStoreAccess('STORE'),        controller.getById);
router.post('/',   platformStoreAccess('STORE_ADMIN'),  controller.create);
router.put('/:id', platformStoreAccess('STORE_ADMIN'),  controller.update);

// Stock requiere también MOD_INVENTORY además de MOD_PRODUCTS
router.patch('/:id/stock',      checkModuleExpiry('MOD_INVENTORY'), platformStoreAccess('STORE_ADMIN', 'STORE_WAREHOUSE'), controller.adjustStock);
router.patch('/:id/activate',   platformStoreAccess('STORE_ADMIN'), controller.activate);
router.patch('/:id/deactivate', platformStoreAccess('STORE_ADMIN'), controller.deactivate);
router.delete('/:id',           platformStoreAccess('STORE_ADMIN'), controller.remove);

module.exports = router;
