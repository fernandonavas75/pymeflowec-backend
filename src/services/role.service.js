'use strict';

const { Role, Permission } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const list = async (organizationId, { limit, offset } = {}) => {
  return await Role.findAndCountAll({
    where:   { organization_id: organizationId },
    include: [{ model: Permission, as: 'permissions', attributes: ['id', 'code', 'module'] }],
    order:   [['name', 'ASC']],
    limit,
    offset,
  });
};

const getById = async (id, organizationId) => {
  const role = await Role.findOne({
    where:   { id, organization_id: organizationId },
    include: [{ model: Permission, as: 'permissions', attributes: ['id', 'code', 'module', 'description'] }],
  });
  if (!role) throw new AppError('Rol no encontrado.', 404);
  return role;
};

const create = async (data, organizationId) => {
  const { name, description, permission_ids } = data;

  const role = await Role.create({ organization_id: organizationId, name, description });

  if (permission_ids?.length) {
    const perms = await Permission.findAll({ where: { id: permission_ids } });
    await role.setPermissions(perms);
  }

  return getById(role.id, organizationId);
};

const update = async (id, data, organizationId) => {
  const role = await Role.findOne({ where: { id, organization_id: organizationId } });
  if (!role) throw new AppError('Rol no encontrado.', 404);

  const { name, description, permission_ids } = data;
  await role.update({ name, description });

  if (permission_ids !== undefined) {
    const perms = await Permission.findAll({ where: { id: permission_ids } });
    await role.setPermissions(perms);
  }

  return getById(id, organizationId);
};

const remove = async (id, organizationId) => {
  const role = await Role.findOne({ where: { id, organization_id: organizationId } });
  if (!role) throw new AppError('Rol no encontrado.', 404);
  if (role.is_system) throw new AppError('No se puede eliminar un rol del sistema.', 403);
  await role.destroy();
};

const listPermissions = async () => {
  return await Permission.findAll({ order: [['module', 'ASC'], ['code', 'ASC']] });
};

module.exports = { list, getById, create, update, remove, listPermissions };
