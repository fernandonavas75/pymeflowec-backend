'use strict';

const { Product } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const list = async (organizationId) => {
  return await Product.findAll({
    where: { organization_id: organizationId },
    order: [['created_at', 'DESC']],
  });
};

const getById = async (id, organizationId) => {
  const product = await Product.findOne({
    where: { id, organization_id: organizationId },
  });
  if (!product) throw new AppError('Producto no encontrado.', 404);
  return product;
};

const create = async (data, organizationId) => {
  const { name, description, category, stock, unit_price } = data;
  return await Product.create({
    organization_id: organizationId,
    name,
    description,
    category,
    stock:      stock      ?? 0,
    unit_price,
  });
};

const update = async (id, data, organizationId) => {
  const product = await Product.findOne({
    where: { id, organization_id: organizationId },
  });
  if (!product) throw new AppError('Producto no encontrado.', 404);
  const { name, description, category, unit_price } = data;
  await product.update({ name, description, category, unit_price });
  return product;
};

const updateStock = async (id, stock, organizationId) => {
  const product = await Product.findOne({
    where: { id, organization_id: organizationId },
  });
  if (!product) throw new AppError('Producto no encontrado.', 404);
  if (stock < 0) throw new AppError('El stock no puede ser negativo.', 400);
  await product.update({ stock });
  return product;
};

const setStatus = async (id, status, organizationId) => {
  const product = await Product.findOne({
    where: { id, organization_id: organizationId },
  });
  if (!product) throw new AppError('Producto no encontrado.', 404);
  await product.update({ status });
  return product;
};

module.exports = { list, getById, create, update, updateStock, setStatus };