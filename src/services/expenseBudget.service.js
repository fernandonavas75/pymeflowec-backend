'use strict';

const { ExpenseBudget, ExpenseCategory, User } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const list = async (companyId, { year, month, limit, offset } = {}) => {
  const where = { company_id: companyId };
  if (year)  where.period_year  = year;
  if (month) where.period_month = month;

  return ExpenseBudget.findAndCountAll({
    where,
    include: [
      { model: ExpenseCategory, as: 'category', attributes: ['id', 'name', 'category_type'] },
    ],
    order: [['period_year', 'DESC'], ['period_month', 'DESC'], ['category_id', 'ASC']],
    limit,
    offset,
  });
};

const getById = async (id, companyId) => {
  const budget = await ExpenseBudget.findOne({
    where: { id, company_id: companyId },
    include: [{ model: ExpenseCategory, as: 'category', attributes: ['id', 'name', 'category_type'] }],
  });
  if (!budget) throw new AppError('Presupuesto no encontrado.', 404);
  return budget;
};

const create = async (data, companyId, userId) => {
  const { category_id, period_type, period_year, period_month, budgeted_amount, notes } = data;

  if (period_type === 'MONTHLY' && !period_month) {
    throw new AppError('period_month es requerido para presupuesto mensual.', 400);
  }
  if (period_type === 'ANNUAL' && period_month) {
    throw new AppError('period_month debe estar vacío para presupuesto anual.', 400);
  }

  return ExpenseBudget.create({
    company_id: companyId,
    category_id,
    period_type,
    period_year,
    period_month: period_month ?? null,
    budgeted_amount,
    notes:       notes ?? null,
    created_by:  userId,
  });
};

const update = async (id, data, companyId) => {
  const budget = await getById(id, companyId);
  const { budgeted_amount, notes } = data;
  await budget.update({
    ...(budgeted_amount !== undefined && { budgeted_amount }),
    ...(notes          !== undefined && { notes }),
  });
  return budget;
};

const remove = async (id, companyId) => {
  const budget = await getById(id, companyId);
  await budget.destroy();
};

module.exports = { list, getById, create, update, remove };
