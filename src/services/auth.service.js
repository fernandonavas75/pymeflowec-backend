'use strict';

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { sequelize } = require('../config/database');
const { User, Role, Company } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const generateTokens = (user) => {
  const payload = {
    id:         user.id,
    company_id: user.company_id ?? null,
  };

  const access_token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

  const refresh_token = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { access_token, refresh_token };
};

const loadUser = (where) =>
  User.findOne({
    where,
    include: [
      { model: Role,    as: 'role',    attributes: ['id', 'name', 'scope'] },
      { model: Company, as: 'company', attributes: ['id', 'name', 'status'] },
    ],
    attributes: ['id', 'full_name', 'email', 'company_id', 'role_id', 'status', 'password_hash'],
  });

const login = async (email, password) => {
  const user = await loadUser({ email: email.toLowerCase().trim() });

  if (!user) throw new AppError('Credenciales inválidas.', 401);
  if (user.status !== 'ACTIVE') throw new AppError('Usuario inactivo o bloqueado.', 403);
  if (user.company_id && user.company?.status !== 'ACTIVE') {
    throw new AppError('Empresa inactiva o suspendida.', 403);
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError('Credenciales inválidas.', 401);

  const tokens = generateTokens(user);

  return {
    user: buildUserPayload(user),
    ...tokens,
  };
};

const me = async (userId) => {
  const user = await User.findOne({
    where: { id: userId, status: 'ACTIVE' },
    include: [
      { model: Role,    as: 'role',    attributes: ['id', 'name', 'scope'] },
      { model: Company, as: 'company', attributes: ['id', 'name', 'status', 'ruc'] },
    ],
    attributes: { exclude: ['password_hash'] },
  });
  if (!user) throw new AppError('Usuario no encontrado.', 404);
  return user;
};

const refresh = async (token) => {
  let payload;
  try {
    payload = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh'
    );
  } catch {
    throw new AppError('Refresh token inválido o expirado.', 401);
  }

  const user = await loadUser({ id: payload.id, status: 'ACTIVE' });
  if (!user) throw new AppError('Usuario no encontrado o inactivo.', 401);
  if (user.company_id && user.company?.status !== 'ACTIVE') {
    throw new AppError('Empresa inactiva.', 403);
  }

  const access_token = jwt.sign(
    { id: user.id, company_id: user.company_id ?? null },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  return { access_token };
};

// Registro de nueva empresa + usuario admin
const register = async (data) => {
  const { company_name, company_ruc, company_email, company_phone,
          full_name, email, password } = data;

  const existingUser = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (existingUser) throw new AppError('El correo electrónico ya está registrado.', 409);

  if (company_ruc) {
    const existingCompany = await Company.findOne({ where: { ruc: company_ruc.trim() } });
    if (existingCompany) throw new AppError('Ya existe una empresa con ese RUC.', 409);
  }

  // El rol STORE_ADMIN debe existir en la BD (seeds)
  const adminRole = await Role.findOne({ where: { name: 'STORE_ADMIN', scope: 'STORE' } });
  if (!adminRole) throw new AppError('Configuración de roles incompleta.', 500);

  const password_hash = await bcrypt.hash(password, 12);

  const { company, user: newUser } = await sequelize.transaction(async (t) => {
    const company = await Company.create(
      { name: company_name, ruc: company_ruc || null, email: company_email || null, phone: company_phone || null },
      { transaction: t }
    );

    const user = await User.create({
      company_id:    company.id,
      role_id:       adminRole.id,
      full_name,
      email,
      password_hash,
    }, { transaction: t });

    return { company, user };
  });

  const fullUser = await loadUser({ id: newUser.id });
  const tokens   = generateTokens(fullUser);

  return {
    user: buildUserPayload(fullUser),
    ...tokens,
  };
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('Usuario no encontrado.', 404);
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw new AppError('Contraseña actual incorrecta.', 400);
  const password_hash = await bcrypt.hash(newPassword, 12);
  await user.update({ password_hash });
};

// ── helpers ──────────────────────────────────────────────────────
const buildUserPayload = (user) => ({
  id:         user.id,
  full_name:  user.full_name,
  email:      user.email,
  role: {
    id:    user.role?.id,
    name:  user.role?.name,
    scope: user.role?.scope,
  },
  company: user.company_id
    ? { id: user.company_id, name: user.company?.name ?? '' }
    : null,
});

module.exports = { login, me, refresh, register, changePassword };
