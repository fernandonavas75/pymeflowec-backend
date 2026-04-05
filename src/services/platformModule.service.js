'use strict';

const { PlatformModule, OrganizationModule, Permission } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const listAll = async () => {
  return PlatformModule.findAll({
    order: [['sort_order', 'ASC']],
  });
};

const listActive = async (organizationId) => {
  return OrganizationModule.findAll({
    where: { organization_id: organizationId, is_active: true },
    include: [{ model: PlatformModule, as: 'module' }],
    order:   [[{ model: PlatformModule, as: 'module' }, 'sort_order', 'ASC']],
  });
};

const getById = async (id) => {
  const mod = await PlatformModule.findByPk(id);
  if (!mod) throw new AppError('Módulo no encontrado.', 404);
  return mod;
};

const listPublic = async () => {
  return PlatformModule.findAll({
    where: { is_active: true },
    attributes: ['id', 'code', 'name', 'description', 'icon', 'is_default', 'sort_order'],
    order: [['sort_order', 'ASC']],
  });
};

module.exports = { listAll, listActive, getById, listPublic };
