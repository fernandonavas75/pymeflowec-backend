'use strict';

const controller   = require('../controllers/auth.controller');
const authenticate = require('../middlewares/authenticate');
const validate     = require('../middlewares/validate');
const { loginRules, refreshRules, registerRules, changePasswordRules } = require('../validators/auth.validators');

module.exports = (loginLimiter) => {
  const router = require('express').Router();

  router.post('/login',    loginLimiter, validate(loginRules),    controller.login);
  router.post('/register', validate(registerRules),               controller.register);
  router.post('/refresh',  validate(refreshRules),                controller.refresh);
  router.get('/me',        authenticate,                          controller.me);
  router.patch('/change-password',
    authenticate,
    validate(changePasswordRules),
    controller.changePassword
  );

  return router;
};
