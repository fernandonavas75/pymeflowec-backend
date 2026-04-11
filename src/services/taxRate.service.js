'use strict';

const { TaxRate } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const list = async (companyId, { limit, offset } = {}) => {
  return TaxRate.findAndCountAll({
    where: { company_id: companyId },
    order: [['valid_from', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id, companyId) => {
  const taxRate = await TaxRate.findOne({ where: { id, company_id: companyId } });
  if (!taxRate) throw new AppError('Tasa de impuesto no encontrada.', 404);
  return taxRate;
};

const create = async (data, companyId) => {
  const { tax_name, percentage, valid_from, valid_to } = data;
  return TaxRate.create({ company_id: companyId, tax_name, percentage, valid_from, valid_to });
};

const update = async (id, data, companyId) => {
  const taxRate = await TaxRate.findOne({ where: { id, company_id: companyId } });
  if (!taxRate) throw new AppError('Tasa de impuesto no encontrada.', 404);
  const { tax_name, percentage, is_active, valid_from, valid_to } = data;
  await taxRate.update({ tax_name, percentage, is_active, valid_from, valid_to });
  return taxRate;
};

module.exports = { list, getById, create, update };
