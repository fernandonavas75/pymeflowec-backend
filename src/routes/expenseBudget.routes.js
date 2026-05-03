'use strict';

const router              = require('express').Router();
const controller          = require('../controllers/expenseBudget.controller');
const authenticate        = require('../middlewares/authenticate');
const platformStoreAccess = require('../middlewares/platformStoreAccess');
const { checkModuleExpiry } = require('../middlewares/checkModuleExpiry');
const validate            = require('../middlewares/validate');
const { createRules, updateRules } = require('../validators/expenseBudget.validators');

router.use(authenticate, checkModuleExpiry('MOD_FINANCE'));

/**
 * @swagger
 * tags:
 *   name: ExpenseBudgets
 *   description: Presupuestos de egresos por categoría y período (MOD_FINANCE)
 */

router.get('/',     platformStoreAccess('STORE'),       controller.list);
router.get('/:id',  platformStoreAccess('STORE'),       controller.getById);
router.post('/',    platformStoreAccess('STORE_ADMIN'), validate(createRules), controller.create);
router.put('/:id',  platformStoreAccess('STORE_ADMIN'), validate(updateRules), controller.update);
router.delete('/:id', platformStoreAccess('STORE_ADMIN'), controller.remove);

module.exports = router;
