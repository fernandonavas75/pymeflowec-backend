'use strict';

const router     = require('express').Router();
const controller = require('../controllers/creditNote.controller');
const auth       = require('../middlewares/authenticate');
const authz      = require('../middlewares/authorize');
const validate   = require('../middlewares/validate');
const { createRules } = require('../validators/creditNote.validators');

router.get('/',    auth, authz('credit_notes.manage'), controller.list);
router.get('/:id', auth, authz('credit_notes.manage'), controller.getById);
router.post('/',   auth, authz('credit_notes.manage'), validate(createRules), controller.create);
router.patch('/:id/status', auth, authz('credit_notes.manage'), controller.setStatus);

module.exports = router;
