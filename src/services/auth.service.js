'use strict';

const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const jwt      = require('jsonwebtoken');
const { Op }   = require('sequelize');
const { sequelize } = require('../config/database');
const { User, Role, Permission, Organization, AuditLog, PlatformStaff, PlatformRole } = require('../models');
const { sendPasswordResetEmail } = require('../utils/mailer');
const { AppError } = require('../middlewares/errorHandler');

const generateTokens = (user) => {
  const payload = {
    id:              user.id,
    organization_id: user.organization_id,
  };

  const access_token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

  const refresh_token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh', {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  return { access_token, refresh_token };
};

const loadUser = (where) =>
  User.findOne({
    where,
    include: [
      {
        model: Role,
        as:    'role',
        include: [{ model: Permission, as: 'permissions', attributes: ['code'] }],
      },
      { model: Organization, as: 'organization' },
      {
        model:    PlatformStaff,
        as:       'platformStaff',
        required: false,
        where:    { is_active: true },
        include:  [{ model: PlatformRole, as: 'platformRole' }],
      },
    ],
  });

const login = async (email, password, ipAddress, userAgent) => {
  const user = await loadUser({ email: email.toLowerCase().trim() });

  if (!user) throw new AppError('Credenciales inválidas.', 401);
  if (user.status !== 'active') throw new AppError('Usuario inactivo o suspendido.', 403);
  if (user.organization_id && user.organization?.status !== 'active') {
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
    ip_address:      ipAddress || null,
    user_agent:      userAgent || null,
  });

  const permissions = user.role?.permissions?.map(p => p.code) ?? [];

  return {
    user: {
      id:           user.id,
      full_name:    user.full_name,
      email:        user.email,
      role:         { id: user.role?.id, name: user.role?.name },
      permissions,
      organization: {
        id:   user.organization_id,
        name: user.organization?.name ?? '',
      },
      platform_staff: user.platformStaff
        ? {
            id:        user.platformStaff.id,
            can_read:  user.platformStaff.platformRole?.can_read  ?? false,
            can_write: user.platformStaff.platformRole?.can_write ?? false,
            role:      user.platformStaff.platformRole?.code ?? null,
          }
        : null,
    },
    ...tokens,
  };
};

const me = async (userId) => {
  const user = await User.findOne({
    where: { id: userId, status: 'active' },
    include: [
      {
        model: Role,
        as:    'role',
        include: [{ model: Permission, as: 'permissions', attributes: ['code', 'module'] }],
      },
      { model: Organization, as: 'organization' },
      {
        model:    PlatformStaff,
        as:       'platformStaff',
        required: false,
        where:    { is_active: true },
        include:  [{ model: PlatformRole, as: 'platformRole' }],
      },
    ],
    attributes: { exclude: ['password_hash', 'reset_token', 'reset_token_expires'] },
  });
  if (!user) throw new AppError('Usuario no encontrado.', 404);
  return user;
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (!user || user.status !== 'active') return;

  const rawToken    = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expires     = new Date(Date.now() + 30 * 60 * 1000);

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
  await user.update({ password_hash: hash, reset_token: null, reset_token_expires: null });

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

  const user = await loadUser({ id: payload.id, status: 'active' });
  if (!user) throw new AppError('Usuario no encontrado o inactivo.', 401);
  if (user.organization_id && user.organization?.status !== 'active') {
    throw new AppError('Organización inactiva.', 403);
  }

  const access_token = jwt.sign(
    { id: user.id, organization_id: user.organization_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  return { access_token };
};

const register = async (data, ipAddress, userAgent) => {
  const { org_name, org_ruc, org_email, org_phone, org_city, full_name, email, password } = data;

  const existingUser = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (existingUser) throw new AppError('El correo electrónico ya está registrado.', 409);

  const existingOrg = await Organization.findOne({ where: { ruc: org_ruc.trim() } });
  if (existingOrg) throw new AppError('Ya existe una organización con ese RUC.', 409);

  const org = await sequelize.transaction(async (t) => {
    const newOrg = await Organization.create(
      { name: org_name, ruc: org_ruc, email: org_email || null, phone: org_phone || null, city: org_city || null },
      { transaction: t }
    );
    await sequelize.query('SELECT onboard_organization(:orgId, NULL)', {
      replacements: { orgId: newOrg.id },
      transaction: t,
    });
    return newOrg;
  });

  const adminRole = await Role.findOne({
    where: { organization_id: org.id, is_system: true },
    order: [['id', 'ASC']],
  }) || await Role.findOne({
    where: { organization_id: org.id },
    order: [['id', 'ASC']],
  });

  if (!adminRole) throw new AppError('Error al configurar la organización.', 500);

  const password_hash = await bcrypt.hash(password, 12);

  const newUser = await User.create({
    organization_id: org.id,
    role_id: adminRole.id,
    full_name,
    email,
    password_hash,
    status: 'active',
  });

  const fullUser = await loadUser({ id: newUser.id });
  if (!fullUser) throw new AppError('Error al crear el usuario.', 500);

  const tokens = generateTokens(fullUser);
  const permissions = fullUser.role?.permissions?.map(p => p.code) ?? [];

  await AuditLog.create({
    organization_id: org.id,
    user_id: newUser.id,
    action: 'REGISTER',
    module: 'auth',
    description: `Nueva organización registrada: ${org_name}. Administrador: ${full_name}.`,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
  });

  return {
    user: {
      id:           fullUser.id,
      full_name:    fullUser.full_name,
      email:        fullUser.email,
      role:         { id: fullUser.role?.id, name: fullUser.role?.name },
      permissions,
      organization: { id: org.id, name: org.name },
      platform_staff: null,
    },
    ...tokens,
  };
};

module.exports = { login, me, forgotPassword, resetPassword, refresh, register };
