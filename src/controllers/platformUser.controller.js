'use strict';

const { Op }    = require('sequelize');
const { User, Role } = require('../models');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

const roleInclude = {
  model:      Role,
  as:         'role',
  attributes: ['id', 'name', 'scope'],
};

/**
 * Lista usuarios de plataforma (company_id IS NULL).
 * Solo accesible para PLATFORM_ADMIN.
 */
const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);

    const where = { company_id: null };

    if (req.query.search) {
      const like = `%${req.query.search}%`;
      where[Op.or] = [
        { full_name: { [Op.iLike]: like } },
        { email:     { [Op.iLike]: like } },
      ];
    }

    const result = await User.findAndCountAll({
      where,
      include:    [roleInclude],
      attributes: { exclude: ['password_hash'] },
      order:      [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.status(200).json({ success: true, ...paginatedResponse(result, page, limit) });
  } catch (err) { next(err); }
};

const setStatus = async (req, res, next) => {
  try {
    const { status } = req.params;
    const user = await User.findOne({ where: { id: req.params.id, company_id: null } });
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });

    // No puede modificarse a sí mismo
    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'No puedes modificar tu propia cuenta.' });
    }

    await user.update({ status });
    const updated = await User.findByPk(user.id, {
      include:    [roleInclude],
      attributes: { exclude: ['password_hash'] },
    });
    res.status(200).json({ success: true, data: updated });
  } catch (err) { next(err); }
};

const lock = async (req, res, next) => {
  req.params.status = 'LOCKED';
  return setStatus(req, res, next);
};

const activate = async (req, res, next) => {
  req.params.status = 'ACTIVE';
  return setStatus(req, res, next);
};

const deactivate = async (req, res, next) => {
  req.params.status = 'INACTIVE';
  return setStatus(req, res, next);
};

module.exports = { list, activate, deactivate, lock };
