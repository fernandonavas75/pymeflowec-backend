'use strict';

const bcrypt = require('bcryptjs');
const { User, Role } = require('../models');
const { AppError } = require('../middlewares/errorHandler');
const crypto = require('crypto');
const { sendPasswordResetEmail, WelcomeEmail } = require('../utils/mailer');

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

  const password_hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    company_id: effectiveCompanyId,
    role_id,
    full_name,
    email,
    password_hash,
  });

  WelcomeEmail(email, full_name, email, password).catch(() => {});

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

const changePassword = async (id, currentPassword, newPassword, companyId, skipCurrentCheck = false) => {
  const user = await User.findOne({ where: { id, company_id: companyId } });
  if (!user) throw new AppError('Usuario no encontrado.', 404);

  if (!skipCurrentCheck) {
    if (!currentPassword) throw new AppError('La contraseña actual es requerida.', 400);
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) throw new AppError('Contraseña actual incorrecta.', 400);
  }

  if (!newPassword) throw new AppError('La nueva contraseña es requerida.', 400);
  const password_hash = await bcrypt.hash(newPassword, 12);
  await user.update({ password_hash });
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (!user) throw new AppError('Usuario no encontrado.', 404);
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000);
  await user.update({ reset_token: resetTokenHash, reset_token_expires: resetTokenExpires });
  await sendPasswordResetEmail(user.email, user.full_name, resetToken);
  return { message: 'Correo de recuperación enviado si el usuario existe.' };
};
const resetPassword = async (token, newPassword) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    where: {
      reset_token: tokenHash,
    },
  });
  if (!user) throw new AppError('Token inválido o expirado.', 400);
  if (!user.reset_token_expires || new Date() > new Date(user.reset_token_expires)) {
    throw new AppError('Token inválido o expirado.', 400);
  }
  const password_hash = await bcrypt.hash(newPassword, 12);
  await user.update({ password_hash, reset_token: null, reset_token_expires: null });
};

const remove = async (id, companyId) => {
  const user = await User.findOne({ where: { id, company_id: companyId } });
  if (!user) throw new AppError('Usuario no encontrado.', 404);
  await user.destroy();
};

module.exports = { list, getById, create, update, setStatus, changePassword, forgotPassword, resetPassword, remove };
