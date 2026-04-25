'use strict';

const router               = require('express').Router();
const controller           = require('../controllers/product.controller');
const authenticate         = require('../middlewares/authenticate');
const authorize            = require('../middlewares/authorize');
const platformStoreAccess  = require('../middlewares/platformStoreAccess');
const validate             = require('../middlewares/validate');
const { bulkCreateRules }  = require('../validators/product.validators');

// /bulk debe ir antes de /:id para que Express no lo interprete como un ID
router.post('/bulk', authenticate, platformStoreAccess('STORE_ADMIN'), validate(bulkCreateRules), controller.bulkCreate);

router.get('/',    authenticate, platformStoreAccess('STORE'),       controller.list);
router.get('/:id', authenticate, platformStoreAccess('STORE'),       controller.getById);
router.post('/',   authenticate, platformStoreAccess('STORE_ADMIN'), controller.create);
router.put('/:id', authenticate, platformStoreAccess('STORE_ADMIN'), controller.update);

router.patch('/:id/stock',      authenticate, platformStoreAccess('STORE_ADMIN', 'STORE_WAREHOUSE'), controller.adjustStock);
router.patch('/:id/activate',   authenticate, platformStoreAccess('STORE_ADMIN'), controller.activate);
router.patch('/:id/deactivate', authenticate, platformStoreAccess('STORE_ADMIN'), controller.deactivate);
router.delete('/:id',           authenticate, platformStoreAccess('STORE_ADMIN'), controller.remove);

module.exports = router;
