'use strict';

const { Role } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

// Roles es un catálogo global — solo lectura para el backend de tienda.
// El admin de plataforma puede crear/editar roles en su panel.

const list = async ({ scope } = {}) => {
  const where = {};
  if (scope) where.scope = scope;
  return Role.findAll({ where, order: [['scope', 'ASC'], ['name', 'ASC']] });
};

const getById = async (id) => {
  const role = await Role.findByPk(id);
  if (!role) throw new AppError('Rol no encontrado.', 404);
  return role;
};

module.exports = { list, getById };
