'use strict';

const router              = require('express').Router();
const controller          = require('../controllers/expensePayment.controller');
const authenticate        = require('../middlewares/authenticate');
const platformStoreAccess = require('../middlewares/platformStoreAccess');
const { checkModuleExpiry } = require('../middlewares/checkModuleExpiry');
const { validate }        = require('../middlewares/validate');
const { createRules }     = require('../validators/expensePayment.validators');

router.use(authenticate, checkModuleExpiry('MOD_FINANCE'));

/**
 * @swagger
 * tags:
 *   name: ExpensePayments
 *   description: Pagos de egresos (MOD_FINANCE)
 */

router.get('/',    platformStoreAccess('STORE'), controller.list);
router.get('/:id', platformStoreAccess('STORE'), controller.getById);
router.post('/',   platformStoreAccess('STORE_ADMIN'), validate(createRules), controller.create);
router.patch('/:id/annul', platformStoreAccess('STORE_ADMIN'), controller.annul);

module.exports = router;
