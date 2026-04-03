'use strict';

const { Category } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const list = async (organizationId, { limit, offset } = {}) => {
  return await Category.findAndCountAll({
    where:   { organization_id: organizationId },
    include: [{ model: Category, as: 'children', attributes: ['id', 'name'] }],
    order:   [['sort_order', 'ASC'], ['name', 'ASC']],
    limit,
    offset,
  });
};

const getById = async (id, organizationId) => {
  const cat = await Category.findOne({
    where:   { id, organization_id: organizationId },
    include: [
      { model: Category, as: 'parent',   attributes: ['id', 'name'] },
      { model: Category, as: 'children', attributes: ['id', 'name'] },
    ],
  });
  if (!cat) throw new AppError('Categoría no encontrada.', 404);
  return cat;
};

const create = async (data, organizationId) => {
  const { name, parent_id, sort_order } = data;

  if (parent_id) {
    const parent = await Category.findOne({ where: { id: parent_id, organization_id: organizationId } });
    if (!parent) throw new AppError('Categoría padre no encontrada.', 404);
  }

  return await Category.create({ organization_id: organizationId, name, parent_id: parent_id || null, sort_order: sort_order ?? 0 });
};

const update = async (id, data, organizationId) => {
  const cat = await Category.findOne({ where: { id, organization_id: organizationId } });
  if (!cat) throw new AppError('Categoría no encontrada.', 404);
  const { name, parent_id, sort_order, is_active } = data;
  await cat.update({ name, parent_id, sort_order, is_active });
  return getById(id, organizationId);
};

const remove = async (id, organizationId) => {
  const cat = await Category.findOne({ where: { id, organization_id: organizationId } });
  if (!cat) throw new AppError('Categoría no encontrada.', 404);
  await cat.destroy();
};

module.exports = { list, getById, create, update, remove };
