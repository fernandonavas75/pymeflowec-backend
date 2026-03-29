'use strict';

const bcrypt   = require('bcryptjs');
const { User, Role, Organization } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const list = async (organizationId, { limit, offset } = {}) => {
  return await User.findAndCountAll({
    where: { organization_id: organizationId },
    include: [{ model: Role, as: 'role' }],
    attributes: { exclude: ['password_hash', 'reset_token', 'reset_token_expires'] },
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id, organizationId) => {
  const user = await User.findOne({
    where: { id, organization_id: organizationId },
    include: [{ model: Role, as: 'role' }],
    attributes: { exclude: ['password_hash', 'reset_token', 'reset_token_expires'] },
  });
  if (!user) throw new AppError('Usuario no encontrado.', 404);
  return user;
};

const create = async (data, organizationId) => {
  const { full_name, email, password, role_id } = data;

  const role = await Role.findByPk(role_id);
  if (!role) throw new AppError('Rol no encontrado.', 404);
  if (role.name === 'superadmin') throw new AppError('No se puede asignar el rol superadmin.', 403);

  const exists = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (exists) throw new AppError('El email ya está registrado.', 409);

  const password_hash = await bcrypt.hash(password, 12);

  const user = await User.create({
    organization_id: organizationId,
    role_id,
    full_name,
    email,
    password_hash,
  });

  return getById(user.id, organizationId);
};

const update = async (id, data, organizationId) => {
  const user = await User.findOne({ where: { id, organization_id: organizationId } });
  if (!user) throw new AppError('Usuario no encontrado.', 404);

  const { full_name, email, role_id } = data;

  if (role_id) {
    const role = await Role.findByPk(role_id);
    if (!role) throw new AppError('Rol no encontrado.', 404);
    if (role.name === 'superadmin') throw new AppError('No se puede asignar el rol superadmin.', 403);
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

  if (newPassword.length < 8) throw new AppError('La contraseña debe tener al menos 8 caracteres.', 400);

  const password_hash = await bcrypt.hash(newPassword, 12);
  await user.update({ password_hash });
};

module.exports = { list, getById, create, update, setStatus, changePassword };