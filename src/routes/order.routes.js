'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/order.controller');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');
const validate     = require('../middlewares/validate');
const { createRules } = require('../validators/order.validators');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Gestión de órdenes
 */

router.get('/',
  authenticate,
  authorize('orders.view'),
  controller.list
);

router.get('/:id',
  authenticate,
  authorize('orders.view'),
  controller.getById
);

router.post('/',
  authenticate,
  authorize('orders.create'),
  validate(createRules),
  controller.create
);

router.patch('/:id/confirm',
  authenticate,
  authorize('orders.create'),
  controller.confirm
);

router.patch('/:id/ship',
  authenticate,
  authorize('orders.edit'),
  controller.ship
);

router.patch('/:id/deliver',
  authenticate,
  authorize('orders.edit'),
  controller.deliver
);

router.patch('/:id/cancel',
  authenticate,
  authorize('orders.edit'),
  controller.cancel
);

module.exports = router;
