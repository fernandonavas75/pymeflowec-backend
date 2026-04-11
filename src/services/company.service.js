'use strict';

const { Company } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const list = async ({ limit, offset } = {}) => {
  return Company.findAndCountAll({
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id) => {
  const company = await Company.findByPk(id);
  if (!company) throw new AppError('Empresa no encontrada.', 404);
  return company;
};

const create = async (data) => {
  const { name, business_name, ruc, email, phone, address } = data;

  if (ruc) {
    const exists = await Company.findOne({ where: { ruc } });
    if (exists) throw new AppError('Ya existe una empresa con ese RUC.', 409);
  }

  return Company.create({ name, business_name, ruc, email, phone, address });
};

const update = async (id, data) => {
  const company = await Company.findByPk(id);
  if (!company) throw new AppError('Empresa no encontrada.', 404);

  const allowed = ['name', 'business_name', 'email', 'phone', 'address'];
  const updates = Object.fromEntries(
    Object.entries(data).filter(([k]) => allowed.includes(k))
  );
  await company.update(updates);
  return company;
};

const setStatus = async (id, status) => {
  const company = await Company.findByPk(id);
  if (!company) throw new AppError('Empresa no encontrada.', 404);
  await company.update({ status });
  return company;
};

module.exports = { list, getById, create, update, setStatus };
