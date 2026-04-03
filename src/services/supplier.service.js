'use strict';

const { Supplier } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const list = async (organizationId, { limit, offset } = {}) => {
  return await Supplier.findAndCountAll({
    where: { organization_id: organizationId },
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id, organizationId) => {
  const supplier = await Supplier.findOne({ where: { id, organization_id: organizationId } });
  if (!supplier) throw new AppError('Proveedor no encontrado.', 404);
  return supplier;
};

const create = async (data, organizationId) => {
  const { business_name, ruc, contact_name, email, phone, address, payment_terms, notes } = data;
  return await Supplier.create({
    organization_id: organizationId,
    business_name,
    ruc,
    contact_name,
    email,
    phone,
    address,
    payment_terms,
    notes,
  });
};

const update = async (id, data, organizationId) => {
  const supplier = await Supplier.findOne({ where: { id, organization_id: organizationId } });
  if (!supplier) throw new AppError('Proveedor no encontrado.', 404);
  const { business_name, ruc, contact_name, email, phone, address, payment_terms, notes } = data;
  await supplier.update({ business_name, ruc, contact_name, email, phone, address, payment_terms, notes });
  return supplier;
};

const setStatus = async (id, status, organizationId) => {
  const supplier = await Supplier.findOne({ where: { id, organization_id: organizationId } });
  if (!supplier) throw new AppError('Proveedor no encontrado.', 404);
  await supplier.update({ status });
  return supplier;
};

const remove = async (id, organizationId) => {
  const supplier = await Supplier.findOne({ where: { id, organization_id: organizationId } });
  if (!supplier) throw new AppError('Proveedor no encontrado.', 404);
  await supplier.destroy();
};

module.exports = { list, getById, create, update, setStatus, remove };
