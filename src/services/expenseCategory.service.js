'use strict';

const { ExpenseCategory } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const list = async (companyId, { limit, offset } = {}) => {
  return ExpenseCategory.findAndCountAll({
    where:  { company_id: companyId },
    order:  [['name', 'ASC']],
    limit,
    offset,
  });
};

const getById = async (id, companyId) => {
  const cat = await ExpenseCategory.findOne({ where: { id, company_id: companyId } });
  if (!cat) throw new AppError('Categoría de egreso no encontrada.', 404);
  return cat;
};

const create = async (data, companyId) => {
  const { name, category_type, description } = data;
  return ExpenseCategory.create({ company_id: companyId, name, category_type, description: description ?? null });
};

const update = async (id, data, companyId) => {
  const cat = await getById(id, companyId);
  const { name, category_type, description, is_active } = data;
  await cat.update({
    ...(name          !== undefined && { name }),
    ...(category_type !== undefined && { category_type }),
    ...(description   !== undefined && { description }),
    ...(is_active     !== undefined && { is_active }),
  });
  return cat;
};

const remove = async (id, companyId) => {
  const cat = await getById(id, companyId);
  await cat.destroy();
};

module.exports = { list, getById, create, update, remove };
