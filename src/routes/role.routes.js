'use strict';

const router     = require('express').Router();
const controller = require('../controllers/role.controller');
const auth       = require('../middlewares/authenticate');
const authz      = require('../middlewares/authorize');
const validate   = require('../middlewares/validate');
const { createRules, updateRules } = require('../validators/role.validators');

router.get('/permissions', auth, authz('roles.manage'), controller.listPermissions);
router.get('/',    auth, authz('roles.manage'), controller.list);
router.get('/:id', auth, authz('roles.manage'), controller.getById);
router.post('/',   auth, authz('roles.manage'), validate(createRules), controller.create);
router.put('/:id', auth, authz('roles.manage'), validate(updateRules), controller.update);
router.delete('/:id', auth, authz('roles.manage'), controller.remove);

module.exports = router;
