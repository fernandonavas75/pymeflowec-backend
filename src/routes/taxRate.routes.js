'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/taxRate.controller');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');

router.get('/',    authenticate, authorize('STORE'), controller.list);
router.get('/:id', authenticate, authorize('STORE'), controller.getById);
router.post('/',   authenticate, authorize('STORE_ADMIN'), controller.create);
router.put('/:id', authenticate, authorize('STORE_ADMIN'), controller.update);

module.exports = router;
