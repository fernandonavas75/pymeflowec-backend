'use strict';

const router     = require('express').Router();
const controller = require('../controllers/category.controller');
const auth       = require('../middlewares/authenticate');
const authz      = require('../middlewares/authorize');
const validate   = require('../middlewares/validate');
const { createRules, updateRules } = require('../validators/category.validators');

router.get('/',    auth, authz('products.view'),   controller.list);
router.get('/:id', auth, authz('products.view'),   controller.getById);
router.post('/',   auth, authz('products.create'), validate(createRules), controller.create);
router.put('/:id', auth, authz('products.edit'),   validate(updateRules), controller.update);
router.delete('/:id', auth, authz('products.delete'), controller.remove);

module.exports = router;
