'use strict';

const router     = require('express').Router();
const controller = require('../controllers/cashRegister.controller');
const auth       = require('../middlewares/authenticate');
const authz      = require('../middlewares/authorize');
const validate   = require('../middlewares/validate');
const { openRules, closeRules, movementRules } = require('../validators/cashRegister.validators');

router.get('/',    auth, authz('cash_register.operate'), controller.list);
router.get('/:id', auth, authz('cash_register.operate'), controller.getById);
router.post('/',   auth, authz('cash_register.operate'), validate(openRules), controller.open);
router.patch('/:id/close',    auth, authz('cash_register.close'),   validate(closeRules),    controller.close);
router.post('/:id/movements', auth, authz('cash_register.operate'), validate(movementRules), controller.addMovement);

module.exports = router;
