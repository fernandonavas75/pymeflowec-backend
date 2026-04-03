'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/supplier.controller');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');
const validate     = require('../middlewares/validate');
const { createRules, updateRules } = require('../validators/supplier.validators');

/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: Gestión de proveedores de la organización
 */

router.get('/',
  authenticate,
  authorize('suppliers.view'),
  controller.list
);

router.get('/:id',
  authenticate,
  authorize('suppliers.view'),
  controller.getById
);

router.post('/',
  authenticate,
  authorize('suppliers.manage'),
  validate(createRules),
  controller.create
);

router.put('/:id',
  authenticate,
  authorize('suppliers.manage'),
  validate(updateRules),
  controller.update
);

router.patch('/:id/activate',
  authenticate,
  authorize('suppliers.manage'),
  controller.activate
);

router.patch('/:id/deactivate',
  authenticate,
  authorize('suppliers.manage'),
  controller.deactivate
);

router.delete('/:id',
  authenticate,
  authorize('suppliers.manage'),
  controller.remove
);

module.exports = router;
