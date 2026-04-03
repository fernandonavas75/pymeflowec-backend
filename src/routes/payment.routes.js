'use strict';

const router     = require('express').Router();
const controller = require('../controllers/payment.controller');
const auth       = require('../middlewares/authenticate');
const authz      = require('../middlewares/authorize');
const validate   = require('../middlewares/validate');
const { createRules } = require('../validators/payment.validators');

router.get('/',    auth, authz('payments.view'),   controller.list);
router.get('/:id', auth, authz('payments.view'),   controller.getById);
router.post('/',   auth, authz('payments.create'), validate(createRules), controller.create);

module.exports = router;
