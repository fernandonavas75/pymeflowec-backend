'use strict';

const router     = require('express').Router();
const controller = require('../controllers/product.controller');
const auth       = require('../middlewares/authenticate');
const authz      = require('../middlewares/authorize');
const validate   = require('../middlewares/validate');
const { createRules, updateRules, adjustStockRules } = require('../validators/product.validators');

router.get('/',    auth, authz('products.view'),   controller.list);
router.get('/:id', auth, authz('products.view'),   controller.getById);
router.post('/',   auth, authz('products.create'), validate(createRules), controller.create);
router.put('/:id', auth, authz('products.edit'),   validate(updateRules), controller.update);

router.patch('/:id/stock',      auth, authz('inventory.adjust'), validate(adjustStockRules), controller.adjustStock);
router.patch('/:id/activate',   auth, authz('products.edit'),    controller.activate);
router.patch('/:id/deactivate', auth, authz('products.edit'),    controller.deactivate);
router.delete('/:id',           auth, authz('products.delete'),  controller.remove);

module.exports = router;
