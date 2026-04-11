'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/storeCustomer.controller');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');

// STORE_ADMIN y STORE_SELLER pueden ver/crear clientes
router.get('/',    authenticate, authorize('STORE'), controller.list);
router.get('/:id', authenticate, authorize('STORE'), controller.getById);
router.post('/',   authenticate, authorize('STORE'), controller.create);
router.put('/:id', authenticate, authorize('STORE_ADMIN'), controller.update);
router.delete('/:id', authenticate, authorize('STORE_ADMIN'), controller.remove);

module.exports = router;
