'use strict';

const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const jwt      = require('jsonwebtoken');
const { Op }   = require('sequelize');
const { User, Role, Organization, AuditLog } = require('../models');
const { sendPasswordResetEmail } = require('../utils/mailer');
const { AppError } = require('../middlewares/errorHandler');

const generateTokens = (user) => {
  const payload = {
    id:              user.id,
    role:            user.role.name,
    organization_id: user.organization_id,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh', {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  return { accessToken, refreshToken };
};

const login = async (email, password) => {
  const user = await User.findOne({
    where: { email: email.toLowerCase().trim() },
    include: [
      { model: Role,         as: 'role' },
      { model: Organization, as: 'organization' },
    ],
  });

  if (!user) throw new AppError('Credenciales inválidas.', 401);

  if (user.status !== 'active') throw new AppError('Usuario inactivo o suspendido.', 403);

  if (user.organization_id && user.organization.status !== 'active') {
    throw new AppError('Organización inactiva.', 403);
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError('Credenciales inválidas.', 401);

  const tokens = generateTokens(user);

  await AuditLog.create({
    organization_id: user.organization_id,
    user_id:         user.id,
    action:          'LOGIN',
    module:          'auth',
    description:     `${user.full_name} inició sesión.`,
  });

  return {
    user: {
      id:              user.id,
      full_name:       user.full_name,
      email:           user.email,
      role:            user.role.name,
      organization_id: user.organization_id,
    },
    ...tokens,
  };
};

const me = async (userId) => {
  const user = await User.findOne({
    where: { id: userId, status: 'active' },
    include: [
      { model: Role,         as: 'role' },
      { model: Organization, as: 'organization' },
    ],
    attributes: { exclude: ['password_hash', 'reset_token', 'reset_token_expires'] },
  });

  if (!user) throw new AppError('Usuario no encontrado.', 404);
  return user;
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

  // Siempre responde igual para no revelar si el email existe
  if (!user || user.status !== 'active') return;

  // Generar token crudo (se envía por email) y guardar solo su hash en la BD
  const rawToken    = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expires     = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

  await user.update({ reset_token: hashedToken, reset_token_expires: expires });

  await sendPasswordResetEmail(user.email, user.full_name, rawToken);

  await AuditLog.create({
    organization_id: user.organization_id,
    user_id:         user.id,
    action:          'RESET_REQUEST',
    module:          'auth',
    description:     `Solicitud de recuperación de contraseña para ${user.email}.`,
  });
};

const resetPassword = async (token, newPassword) => {
  // Hashear el token recibido para compararlo con el almacenado en BD
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    where: {
      reset_token:         hashedToken,
      reset_token_expires: { [Op.gt]: new Date() },
      status:              'active',
    },
  });

  if (!user) throw new AppError('Token inválido o expirado.', 400);

  const hash = await bcrypt.hash(newPassword, 12);

  await user.update({
    password_hash:       hash,
    reset_token:         null,
    reset_token_expires: null,
  });

  await AuditLog.create({
    organization_id: user.organization_id,
    user_id:         user.id,
    action:          'RESET_PASSWORD',
    module:          'auth',
    description:     `Contraseña restablecida para ${user.email}.`,
  });
};

const refresh = async (token) => {
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh');
  } catch {
    throw new AppError('Refresh token inválido o expirado.', 401);
  }

  // Verificar que el usuario siga activo
  const user = await User.findOne({
    where: { id: payload.id, status: 'active' },
    include: [
      { model: Role,         as: 'role' },
      { model: Organization, as: 'organization' },
    ],
  });

  if (!user) throw new AppError('Usuario no encontrado o inactivo.', 401);
  if (user.organization_id && user.organization.status !== 'active') {
    throw new AppError('Organización inactiva.', 403);
  }

  const accessToken = jwt.sign(
    { id: user.id, role: user.role.name, organization_id: user.organization_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  return { accessToken };
};

module.exports = { login, me, forgotPassword, resetPassword, refresh };