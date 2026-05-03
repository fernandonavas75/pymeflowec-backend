'use strict';

const router              = require('express').Router();
const controller          = require('../controllers/expenseRecurring.controller');
const authenticate        = require('../middlewares/authenticate');
const platformStoreAccess = require('../middlewares/platformStoreAccess');
const { checkModuleExpiry } = require('../middlewares/checkModuleExpiry');
const validate            = require('../middlewares/validate');
const { createRules, updateRules } = require('../validators/expenseRecurring.validators');

router.use(authenticate, checkModuleExpiry('MOD_FINANCE'));

/**
 * @swagger
 * tags:
 *   name: ExpenseRecurring
 *   description: Plantillas de egresos recurrentes (MOD_FINANCE)
 */

router.get('/',     platformStoreAccess('STORE'),       controller.list);
router.get('/:id',  platformStoreAccess('STORE'),       controller.getById);
router.post('/',    platformStoreAccess('STORE_ADMIN'), validate(createRules), controller.create);
router.put('/:id',  platformStoreAccess('STORE_ADMIN'), validate(updateRules), controller.update);
router.delete('/:id', platformStoreAccess('STORE_ADMIN'), controller.remove);

module.exports = router;
