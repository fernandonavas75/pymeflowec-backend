'use strict';

const { Supplier } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const list = async (companyId, { limit, offset } = {}) => {
  return Supplier.findAndCountAll({
    where: { company_id: companyId },
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id, companyId) => {
  const supplier = await Supplier.findOne({ where: { id, company_id: companyId } });
  if (!supplier) throw new AppError('Proveedor no encontrado.', 404);
  return supplier;
};

const create = async (data, companyId) => {
  const { name, ruc, phone, email, address } = data;
  return Supplier.create({ company_id: companyId, name, ruc, phone, email, address });
};

const update = async (id, data, companyId) => {
  const supplier = await Supplier.findOne({ where: { id, company_id: companyId } });
  if (!supplier) throw new AppError('Proveedor no encontrado.', 404);
  const { name, ruc, phone, email, address } = data;
  await supplier.update({ name, ruc, phone, email, address });
  return supplier;
};

const remove = async (id, companyId) => {
  const supplier = await Supplier.findOne({ where: { id, company_id: companyId } });
  if (!supplier) throw new AppError('Proveedor no encontrado.', 404);
  await supplier.destroy();
};

module.exports = { list, getById, create, update, remove };
