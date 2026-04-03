'use strict';

const bcrypt   = require('bcryptjs');
const { User, Role, Permission } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const userAttrs = { exclude: ['password_hash', 'reset_token', 'reset_token_expires'] };

const roleInclude = {
  model: Role,
  as:    'role',
  include: [{ model: Permission, as: 'permissions', attributes: ['code'] }],
};

const list = async (organizationId, { limit, offset } = {}) => {
  return await User.findAndCountAll({
    where:      { organization_id: organizationId },
    include:    [roleInclude],
    attributes: userAttrs,
    order:      [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id, organizationId) => {
  const user = await User.findOne({
    where:      { id, organization_id: organizationId },
    include:    [roleInclude],
    attributes: userAttrs,
  });
  if (!user) throw new AppError('Usuario no encontrado.', 404);
  return user;
};

const create = async (data, organizationId) => {
  const { full_name, email, password, role_id } = data;

  // Role must belong to the same organization
  const role = await Role.findOne({ where: { id: role_id, organization_id: organizationId } });
  if (!role) throw new AppError('Rol no encontrado en esta organización.', 404);

  const exists = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (exists) throw new AppError('El email ya está registrado.', 409);

  const password_hash = await bcrypt.hash(password, 12);

  const user = await User.create({ organization_id: organizationId, role_id, full_name, email, password_hash });
  return getById(user.id, organizationId);
};

const update = async (id, data, organizationId) => {
  const user = await User.findOne({ where: { id, organization_id: organizationId } });
  if (!user) throw new AppError('Usuario no encontrado.', 404);

  const { full_name, email, role_id } = data;

  if (role_id) {
    const role = await Role.findOne({ where: { id: role_id, organization_id: organizationId } });
    if (!role) throw new AppError('Rol no encontrado en esta organización.', 404);
  }

  if (email && email.toLowerCase().trim() !== user.email) {
    const exists = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (exists) throw new AppError('El email ya está registrado.', 409);
  }

  await user.update({ full_name, email, role_id });
  return getById(user.id, organizationId);
};

const setStatus = async (id, status, organizationId) => {
  const user = await User.findOne({ where: { id, organization_id: organizationId } });
  if (!user) throw new AppError('Usuario no encontrado.', 404);
  await user.update({ status });
  return getById(user.id, organizationId);
};

const changePassword = async (id, currentPassword, newPassword, organizationId) => {
  const user = await User.findOne({ where: { id, organization_id: organizationId } });
  if (!user) throw new AppError('Usuario no encontrado.', 404);

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw new AppError('Contraseña actual incorrecta.', 400);

  const password_hash = await bcrypt.hash(newPassword, 12);
  await user.update({ password_hash });
};

const remove = async (id, organizationId) => {
  const user = await User.findOne({ where: { id, organization_id: organizationId } });
  if (!user) throw new AppError('Usuario no encontrado.', 404);
  await user.destroy();
};

module.exports = { list, getById, create, update, setStatus, changePassword, remove };
