'use strict';

const router       = require('express').Router();
const controller   = require('../controllers/user.controller');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');
const validate     = require('../middlewares/validate');
const { createRules, updateRules, changePasswordRules } = require('../validators/user.validators');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios de la organización
 */

router.get('/',
  authenticate,
  authorize('users.view'),
  controller.list
);

router.get('/:id',
  authenticate,
  authorize('users.view'),
  controller.getById
);

router.post('/',
  authenticate,
  authorize('users.manage'),
  validate(createRules),
  controller.create
);

router.put('/:id',
  authenticate,
  authorize('users.manage'),
  validate(updateRules),
  controller.update
);

router.patch('/:id/activate',
  authenticate,
  authorize('users.manage'),
  controller.activate
);

router.patch('/:id/deactivate',
  authenticate,
  authorize('users.manage'),
  controller.deactivate
);

router.patch('/:id/change-password',
  authenticate,
  validate(changePasswordRules),
  controller.changePassword
);

router.delete('/:id',
  authenticate,
  authorize('users.manage'),
  controller.remove
);

module.exports = router;
