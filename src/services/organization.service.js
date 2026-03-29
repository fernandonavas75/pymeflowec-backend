'use strict';

const { Organization, User } = require('../models');
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

const create = async (data) => {
  const { name, ruc, email, phone, address } = data;
  const org = await Organization.create({ name, ruc, email, phone, address });
  return org;
};

const update = async (id, data) => {
  const org = await Organization.findByPk(id);
  if (!org) throw new AppError('Organización no encontrada.', 404);
  const { name, email, phone, address, tax_rate } = data;
  await org.update({ name, email, phone, address, tax_rate });
  return org;
};

const setStatus = async (id, status) => {
  const org = await Organization.findByPk(id);
  if (!org) throw new AppError('Organización no encontrada.', 404);
  await org.update({ status });
  return org;
};

module.exports = { list, getById, create, update, setStatus };