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

module.exports = { listAll, listActive, getById };
