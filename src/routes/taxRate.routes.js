'use strict';

const router     = require('express').Router();
const controller = require('../controllers/taxRate.controller');
const auth       = require('../middlewares/authenticate');
const authz      = require('../middlewares/authorize');
const validate   = require('../middlewares/validate');
const { createRules, updateRules } = require('../validators/taxRate.validators');

router.get('/',    auth, authz('products.view'),    controller.list);
router.get('/:id', auth, authz('products.view'),    controller.getById);
router.post('/',   auth, authz('settings.manage'),  validate(createRules), controller.create);
router.put('/:id', auth, authz('settings.manage'),  validate(updateRules), controller.update);

module.exports = router;
