'use strict';

const router     = require('express').Router();
const controller = require('../controllers/purchaseOrder.controller');
const auth       = require('../middlewares/authenticate');
const authz      = require('../middlewares/authorize');
const validate   = require('../middlewares/validate');
const { createRules, receiveRules } = require('../validators/purchaseOrder.validators');

router.get('/',    auth, authz('purchases.view'),   controller.list);
router.get('/:id', auth, authz('purchases.view'),   controller.getById);
router.post('/',   auth, authz('purchases.manage'), validate(createRules), controller.create);
router.patch('/:id/receive', auth, authz('purchases.manage'), validate(receiveRules), controller.receive);
router.patch('/:id/status',  auth, authz('purchases.manage'), controller.updateStatus);

module.exports = router;
