'use strict';

const router              = require('express').Router();
const controller          = require('../controllers/productCategory.controller');
const authenticate        = require('../middlewares/authenticate');
const platformStoreAccess = require('../middlewares/platformStoreAccess');
const validate            = require('../middlewares/validate');
const { checkModuleExpiry } = require('../middlewares/checkModuleExpiry');
const { createRules, updateRules } = require('../validators/productCategory.validators');

/**
 * @swagger
 * tags:
 *   name: ProductCategories
 *   description: Categorías de productos (MOD_PRODUCTS)
 */

router.use(authenticate, checkModuleExpiry('MOD_PRODUCTS'));

router.get('/',    platformStoreAccess('STORE'),       controller.list);
router.get('/:id', platformStoreAccess('STORE'),       controller.getById);
router.post('/',   platformStoreAccess('STORE_ADMIN'), validate(createRules), controller.create);
router.put('/:id', platformStoreAccess('STORE_ADMIN'), validate(updateRules), controller.update);
router.delete('/:id', platformStoreAccess('STORE_ADMIN'), controller.remove);

module.exports = router;
