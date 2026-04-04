'use strict';

const { sequelize } = require('../config/database');
const { Organization } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const list = async ({ limit, offset } = {}) => {
  return await Organization.findAndCountAll({
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id) => {
  const org = await Organization.findByPk(id);
  if (!org) throw new AppError('Organización no encontrada.', 404);
  return org;
};

/**
 * Creates an organization and runs the DB onboarding functions inside a
 * single transaction: create_default_roles, create_default_client,
 * create_default_expense_categories.
 */
const create = async (data) => {
  const { name, ruc, email, phone, address, city, province } = data;

  return await sequelize.transaction(async (t) => {
    const org = await Organization.create(
      { name, ruc, email, phone, address, city, province },
      { transaction: t }
    );

    await sequelize.query('SELECT onboard_organization(:orgId, NULL)', { replacements: { orgId: org.id }, transaction: t });

    return org;
  });
};

const update = async (id, data) => {
  const org = await Organization.findByPk(id);
  if (!org) throw new AppError('Organización no encontrada.', 404);

  const allowed = [
    'name', 'email', 'phone', 'address', 'city', 'province', 'logo_url',
    'default_tax_id', 'currency',
    'sri_ambiente', 'sri_tipo_emision', 'sri_obligado_contab',
    'sri_contribuyente_especial', 'sri_firma_path',
    'sri_establecimiento', 'sri_punto_emision',
  ];
  const updates = Object.fromEntries(
    Object.entries(data).filter(([k]) => allowed.includes(k))
  );
  await org.update(updates);
  return org;
};

const setStatus = async (id, status) => {
  const org = await Organization.findByPk(id);
  if (!org) throw new AppError('Organización no encontrada.', 404);
  await org.update({ status });
  return org;
};

module.exports = { list, getById, create, update, setStatus };
