'use strict';

const { Op } = require('sequelize');
const { AuditLog, User, Company } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const userInclude = {
  model:      User,
  as:         'user',
  attributes: ['id', 'full_name', 'email'],
  required:   false,
};

const companyInclude = {
  model:      Company,
  as:         'company',
  attributes: ['id', 'name'],
  required:   false,
};

/**
 * Lista registros de auditoría con filtros opcionales.
 * Solo accesible desde la plataforma (PLATFORM scope).
 *
 * @param {object} filters
 * @param {number}  [filters.company_id]
 * @param {string}  [filters.action]      - INSERT | UPDATE | DELETE
 * @param {string}  [filters.table_name]
 * @param {string}  [filters.date_from]   - YYYY-MM-DD
 * @param {string}  [filters.date_to]     - YYYY-MM-DD
 * @param {string}  [filters.search]      - busca en table_name, action, ip_address
 * @param {number}  limit
 * @param {number}  offset
 */
const list = async (filters = {}, { limit = 50, offset = 0 } = {}) => {
  const where = {};

  if (filters.company_id) {
    where.company_id = filters.company_id;
  }

  if (filters.action) {
    where.action = filters.action.toUpperCase();
  }

  if (filters.table_name) {
    where.table_name = filters.table_name;
  }

  if (filters.date_from || filters.date_to) {
    where.created_at = {};
    if (filters.date_from) {
      where.created_at[Op.gte] = new Date(filters.date_from);
    }
    if (filters.date_to) {
      // Incluye todo el día hasta las 23:59:59
      const to = new Date(filters.date_to);
      to.setHours(23, 59, 59, 999);
      where.created_at[Op.lte] = to;
    }
  }

  if (filters.search) {
    const like = `%${filters.search}%`;
    where[Op.or] = [
      { table_name: { [Op.iLike]: like } },
      { action:     { [Op.iLike]: like } },
      { ip_address: { [Op.iLike]: like } },
    ];
  }

  return AuditLog.findAndCountAll({
    where,
    include: [userInclude, companyInclude],
    order:   [['created_at', 'DESC']],
    limit,
    offset,
  });
};

module.exports = { list };
