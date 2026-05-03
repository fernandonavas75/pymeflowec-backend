'use strict';

const router       = require('express').Router();
const { Role }     = require('../models');
const authenticate = require('../middlewares/authenticate');

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Roles disponibles para asignación de usuarios
 */

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Listar roles de tienda (para dropdowns de gestión de usuarios)
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: Lista de roles con scope STORE
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:          { type: integer }
 *                       name:        { type: string }
 *                       scope:       { type: string }
 *                       description: { type: string }
 */

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
