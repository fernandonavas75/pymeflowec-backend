'use strict';

const bcrypt = require('bcryptjs');
const { Op }    = require('sequelize');
const { User, Role } = require('../models');
const { parsePagination, paginatedResponse } = require('../utils/pagination');
const { AppError } = require('../middlewares/errorHandler');
const { WelcomeEmail } = require('../utils/mailer');

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

/**
 * Lista los usuarios de una empresa específica.
 * Accesible para cualquier usuario de plataforma (PLATFORM_ADMIN o PLATFORM_SUPPORT).
 */
const listByCompany = async (req, res, next) => {
  try {
    const companyId = Number(req.params.id);
    if (!companyId) return res.status(400).json({ success: false, message: 'company_id inválido.' });

    const { page, limit, offset } = parsePagination(req.query);

    const result = await User.findAndCountAll({
      where:      { company_id: companyId },
      include:    [roleInclude],
      attributes: { exclude: ['password_hash'] },
      order:      [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.status(200).json({ success: true, ...paginatedResponse(result, page, limit) });
  } catch (err) { next(err); }
};

/**
 * Crea un nuevo usuario de plataforma (PLATFORM_ADMIN o PLATFORM_SUPPORT).
 * Solo accesible para PLATFORM_ADMIN.
 */
const create = async (req, res, next) => {
  try {
    const { full_name, email, password, role_id } = req.body;

    if (!full_name || !email || !password || !role_id) {
      return res.status(400).json({ success: false, message: 'full_name, email, password y role_id son requeridos.' });
    }

    const role = await Role.findOne({ where: { id: role_id, scope: 'PLATFORM' } });
    if (!role) {
      return res.status(404).json({ success: false, message: 'Rol de plataforma no encontrado.' });
    }

    const exists = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (exists) {
      return res.status(409).json({ success: false, message: 'El email ya está registrado.' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      full_name:    full_name.trim(),
      email:        email.toLowerCase().trim(),
      password_hash,
      role_id,
      company_id:   null,
      status:       'ACTIVE',
    });

    const created = await User.findByPk(user.id, {
      include:    [roleInclude],
      attributes: { exclude: ['password_hash'] },
    });

    WelcomeEmail(email.toLowerCase().trim(), full_name.trim(), email.toLowerCase().trim(), password).catch(() => {});

    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
};

module.exports = { list, listByCompany, create, activate, deactivate, lock };
