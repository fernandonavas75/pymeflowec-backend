'use strict';

const router     = require('express').Router();
const controller = require('../controllers/expense.controller');
const auth       = require('../middlewares/authenticate');
const authz      = require('../middlewares/authorize');
const validate   = require('../middlewares/validate');
const { createRules, createCategoryRules } = require('../validators/expense.validators');

router.get('/categories',    auth, authz('expenses.view'),   controller.listCategories);
router.post('/categories',   auth, authz('expenses.manage'), validate(createCategoryRules), controller.createCategory);
router.get('/',              auth, authz('expenses.view'),   controller.list);
router.get('/:id',           auth, authz('expenses.view'),   controller.getById);
router.post('/',             auth, authz('expenses.create'), validate(createRules), controller.create);
router.patch('/:id/cancel',  auth, authz('expenses.cancel'), controller.cancel);

module.exports = router;
