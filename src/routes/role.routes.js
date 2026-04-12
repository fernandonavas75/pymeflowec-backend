'use strict';

const router       = require('express').Router();
const { Role }     = require('../models');
const authenticate = require('../middlewares/authenticate');

// GET /api/roles — returns all STORE-scope roles for user management dropdowns
router.get('/', authenticate, async (req, res, next) => {
  try {
    const roles = await Role.findAll({
      where:      { scope: 'STORE' },
      attributes: ['id', 'name', 'scope', 'description'],
      order:      [['name', 'ASC']],
    });
    res.json({ success: true, data: roles });
  } catch (err) { next(err); }
});

module.exports = router;
