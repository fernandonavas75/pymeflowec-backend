'use strict';

const bcrypt = require('bcryptjs');
const { User, Role } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const userAttrs = { exclude: ['password_hash'] };

const roleInclude = {
  model:      Role,
  as:         'role',
  attributes: ['id', 'name', 'scope'],
};

const list = async (companyId, { limit, offset } = {}) => {
  return User.findAndCountAll({
    where:      { company_id: companyId },
    include:    [roleInclude],
    attributes: userAttrs,
    order:      [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id, companyId) => {
  const user = await User.findOne({
    where:      { id, company_id: companyId },
    include:    [roleInclude],
    attributes: userAttrs,
  });
  if (!user) throw new AppError('Usuario no encontrado.', 404);
  return user;
};

const create = async (data, companyId) => {
  const { full_name, email, password, role_id } = data;

  // Si el creador es de plataforma (company_id = null) debe pasar la empresa destino en el body
  const effectiveCompanyId = companyId ?? data.company_id ?? null;
  if (!effectiveCompanyId) {
    throw new AppError('Se requiere especificar la empresa para el nuevo usuario.', 400);
  }

  // El rol debe tener scope STORE
  const role = await Role.findOne({ where: { id: role_id, scope: 'STORE' } });
  if (!role) throw new AppError('Rol de tienda no encontrado.', 404);

  const exists = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (exists) throw new AppError('El email ya está registrado.', 409);

  const password_hash = await bcrypt.hash(password, 12);
  const user = await User.create({
    company_id: effectiveCompanyId,
    role_id,
    full_name,
    email,
    password_hash,
  });
  return getById(user.id, effectiveCompanyId);
};

const update = async (id, data, companyId) => {
  const user = await User.findOne({ where: { id, company_id: companyId } });
  if (!user) throw new AppError('Usuario no encontrado.', 404);

  const { full_name, email, role_id } = data;

  if (role_id) {
    const role = await Role.findOne({ where: { id: role_id, scope: 'STORE' } });
    if (!role) throw new AppError('Rol de tienda no encontrado.', 404);
  }

  if (email && email.toLowerCase().trim() !== user.email) {
    const exists = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (exists) throw new AppError('El email ya está registrado.', 409);
  }

  await user.update({ full_name, email, role_id });
  return getById(user.id, companyId);
};

const setStatus = async (id, status, companyId) => {
  const user = await User.findOne({ where: { id, company_id: companyId } });
  if (!user) throw new AppError('Usuario no encontrado.', 404);
  await user.update({ status });
  return getById(user.id, companyId);
};

const changePassword = async (id, currentPassword, newPassword, companyId) => {
  const user = await User.findOne({ where: { id, company_id: companyId } });
  if (!user) throw new AppError('Usuario no encontrado.', 404);
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw new AppError('Contraseña actual incorrecta.', 400);
  const password_hash = await bcrypt.hash(newPassword, 12);
  await user.update({ password_hash });
};

const remove = async (id, companyId) => {
  const user = await User.findOne({ where: { id, company_id: companyId } });
  if (!user) throw new AppError('Usuario no encontrado.', 404);
  await user.destroy();
};

module.exports = { list, getById, create, update, setStatus, changePassword, remove };
