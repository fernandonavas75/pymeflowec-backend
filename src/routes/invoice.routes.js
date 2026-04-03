'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/invoice.controller');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');
const validate     = require('../middlewares/validate');
const { createFromOrderRules, createManualRules } = require('../validators/invoice.validators');

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: Gestión de facturas
 */

router.get('/',
  authenticate,
  authorize('invoices.view'),
  controller.list
);

router.get('/:id',
  authenticate,
  authorize('invoices.view'),
  controller.getById
);

router.post('/from-order',
  authenticate,
  authorize('invoices.create'),
  validate(createFromOrderRules),
  controller.createFromOrder
);

router.post('/manual',
  authenticate,
  authorize('invoices.create'),
  validate(createManualRules),
  controller.createManual
);

router.patch('/:id/paid',
  authenticate,
  authorize('invoices.create'),
  controller.markPaid
);

router.patch('/:id/overdue',
  authenticate,
  authorize('invoices.create'),
  controller.markOverdue
);

router.patch('/:id/cancel',
  authenticate,
  authorize('invoices.cancel'),
  controller.cancel
);

module.exports = router;
