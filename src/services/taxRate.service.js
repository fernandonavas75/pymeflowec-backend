'use strict';

const { TaxRate } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const list = async ({ limit, offset } = {}) => {
  return await TaxRate.findAndCountAll({
    order: [['effective_from', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id) => {
  const taxRate = await TaxRate.findByPk(id);
  if (!taxRate) throw new AppError('Tasa de impuesto no encontrada.', 404);
  return taxRate;
};

const create = async (data) => {
  const { name, percentage, sri_code, sri_percentage_code, effective_from, effective_until, description } = data;
  return await TaxRate.create({ name, percentage, sri_code, sri_percentage_code, effective_from, effective_until, description });
};

const update = async (id, data) => {
  const taxRate = await TaxRate.findByPk(id);
  if (!taxRate) throw new AppError('Tasa de impuesto no encontrada.', 404);
  const { name, percentage, sri_code, sri_percentage_code, effective_from, effective_until, is_active, description } = data;
  await taxRate.update({ name, percentage, sri_code, sri_percentage_code, effective_from, effective_until, is_active, description });
  return taxRate;
};

module.exports = { list, getById, create, update };
