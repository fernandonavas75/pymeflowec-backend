'use strict';

const { Supplier } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const list = async (organizationId) => {
  return await Supplier.findAll({
    where: { organization_id: organizationId },
    order: [['created_at', 'DESC']],
  });
};

const getById = async (id, organizationId) => {
  const supplier = await Supplier.findOne({
    where: { id, organization_id: organizationId },
  });
  if (!supplier) throw new AppError('Proveedor no encontrado.', 404);
  return supplier;
};

const create = async (data, organizationId) => {
  const { business_name, contact_name, email, phone, address } = data;
  return await Supplier.create({
    organization_id: organizationId,
    business_name,
    contact_name,
    email,
    phone,
    address,
  });
};

const update = async (id, data, organizationId) => {
  const supplier = await Supplier.findOne({
    where: { id, organization_id: organizationId },
  });
  if (!supplier) throw new AppError('Proveedor no encontrado.', 404);
  const { business_name, contact_name, email, phone, address } = data;
  await supplier.update({ business_name, contact_name, email, phone, address });
  return supplier;
};

const setStatus = async (id, status, organizationId) => {
  const supplier = await Supplier.findOne({
    where: { id, organization_id: organizationId },
  });
  if (!supplier) throw new AppError('Proveedor no encontrado.', 404);
  await supplier.update({ status });
  return supplier;
};

module.exports = { list, getById, create, update, setStatus };