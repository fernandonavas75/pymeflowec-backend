'use strict';

const { StoreCustomer } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const list = async (companyId, { limit, offset } = {}) => {
  return StoreCustomer.findAndCountAll({
    where: { company_id: companyId },
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id, companyId) => {
  const customer = await StoreCustomer.findOne({
    where: { id, company_id: companyId },
  });
  if (!customer) throw new AppError('Cliente no encontrado.', 404);
  return customer;
};

const create = async (data, companyId) => {
  const { customer_type, document_number, full_name, email, phone, address } = data;

  // Evitar duplicado por documento (activos)
  const exists = await StoreCustomer.findOne({
    where: { company_id: companyId, document_number },
  });
  if (exists) throw new AppError('Ya existe un cliente con ese número de documento.', 409);

  return StoreCustomer.create({
    company_id: companyId,
    customer_type: customer_type || 'CEDULA',
    document_number,
    full_name,
    email,
    phone,
    address,
  });
};

const update = async (id, data, companyId) => {
  const customer = await StoreCustomer.findOne({ where: { id, company_id: companyId } });
  if (!customer) throw new AppError('Cliente no encontrado.', 404);
  if (customer.customer_type === 'FINAL_CONSUMER') {
    throw new AppError('No se puede modificar el Consumidor Final.', 403);
  }

  const { full_name, document_number, customer_type, email, phone, address } = data;

  if (document_number && document_number !== customer.document_number) {
    const exists = await StoreCustomer.findOne({ where: { company_id: companyId, document_number } });
    if (exists) throw new AppError('Ya existe un cliente con ese número de documento.', 409);
  }

  await customer.update({ full_name, document_number, customer_type, email, phone, address });
  return customer;
};

const remove = async (id, companyId) => {
  const customer = await StoreCustomer.findOne({ where: { id, company_id: companyId } });
  if (!customer) throw new AppError('Cliente no encontrado.', 404);
  if (customer.customer_type === 'FINAL_CONSUMER') {
    throw new AppError('No se puede eliminar el Consumidor Final.', 403);
  }
  await customer.destroy();
};

module.exports = { list, getById, create, update, remove };
