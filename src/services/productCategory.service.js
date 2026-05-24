'use strict';

const { ProductCategory } = require('../models');
const { AppError }        = require('../middlewares/errorHandler');

const list = async (companyId, { limit, offset } = {}) => {
  return ProductCategory.findAndCountAll({
    where:  { company_id: companyId },
    order:  [['name', 'ASC']],
    limit,
    offset,
  });
};

const getById = async (id, companyId) => {
  const cat = await ProductCategory.findOne({ where: { id, company_id: companyId } });
  if (!cat) throw new AppError('Categoría no encontrada.', 404);
  return cat;
};

const create = async (data, companyId) => {
  const { name, description } = data;
  const exists = await ProductCategory.findOne({
    where: { company_id: companyId, name: name.trim() },
  });
  if (exists) throw new AppError('Ya existe una categoría con ese nombre.', 409);
  return ProductCategory.create({ company_id: companyId, name, description });
};

const update = async (id, data, companyId) => {
  const cat = await getById(id, companyId);
  const { name, description, status } = data;
  if (name) {
    const conflict = await ProductCategory.findOne({
      where: { company_id: companyId, name: name.trim() },
    });
    if (conflict && Number(conflict.id) !== Number(id))
      throw new AppError('Ya existe una categoría con ese nombre.', 409);
  }
  await cat.update({ name, description, status });
  return cat;
};

const remove = async (id, companyId) => {
  const cat = await getById(id, companyId);
  await cat.destroy();
};

module.exports = { list, getById, create, update, remove };
