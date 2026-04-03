'use strict';

const { Client } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const list = async (organizationId, { limit, offset } = {}) => {
  return await Client.findAndCountAll({
    where: { organization_id: organizationId },
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id, organizationId) => {
  const client = await Client.findOne({ where: { id, organization_id: organizationId } });
  if (!client) throw new AppError('Cliente no encontrado.', 404);
  return client;
};

const create = async (data, organizationId) => {
  const { full_name, identification, identification_type, client_type, email, phone, address } = data;

  const exists = await Client.findOne({ where: { organization_id: organizationId, identification } });
  if (exists) throw new AppError('Ya existe un cliente con esa identificación.', 409);

  return await Client.create({
    organization_id: organizationId,
    full_name,
    identification,
    identification_type: identification_type || 'cedula',
    client_type:         client_type         || 'individual',
    email,
    phone,
    address,
  });
};

const update = async (id, data, organizationId) => {
  const client = await Client.findOne({ where: { id, organization_id: organizationId } });
  if (!client) throw new AppError('Cliente no encontrado.', 404);
  if (client.is_default) throw new AppError('No se puede modificar el Consumidor Final.', 403);

  const { full_name, identification, identification_type, client_type, email, phone, address } = data;

  if (identification && identification !== client.identification) {
    const exists = await Client.findOne({ where: { organization_id: organizationId, identification } });
    if (exists) throw new AppError('Ya existe un cliente con esa identificación.', 409);
  }

  await client.update({ full_name, identification, identification_type, client_type, email, phone, address });
  return client;
};

const setStatus = async (id, status, organizationId) => {
  const client = await Client.findOne({ where: { id, organization_id: organizationId } });
  if (!client) throw new AppError('Cliente no encontrado.', 404);
  if (client.is_default) throw new AppError('No se puede desactivar el Consumidor Final.', 403);
  await client.update({ status });
  return client;
};

const remove = async (id, organizationId) => {
  const client = await Client.findOne({ where: { id, organization_id: organizationId } });
  if (!client) throw new AppError('Cliente no encontrado.', 404);
  if (client.is_default) throw new AppError('No se puede eliminar el Consumidor Final.', 403);
  await client.destroy();
};

module.exports = { list, getById, create, update, setStatus, remove };
