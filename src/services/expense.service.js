'use strict';

const { Expense, ExpenseCategory, Supplier, User } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const expenseInclude = [
  { model: ExpenseCategory, as: 'category', attributes: ['id', 'name'] },
  { model: User,            as: 'user',     attributes: ['id', 'full_name'] },
  { model: Supplier,        as: 'supplier', attributes: ['id', 'business_name'] },
];

const list = async (organizationId, { limit, offset } = {}) => {
  return await Expense.findAndCountAll({
    where:   { organization_id: organizationId },
    include: expenseInclude,
    order:   [['expense_date', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id, organizationId) => {
  const expense = await Expense.findOne({ where: { id, organization_id: organizationId }, include: expenseInclude });
  if (!expense) throw new AppError('Gasto no encontrado.', 404);
  return expense;
};

const create = async (data, organizationId, userId) => {
  const { category_id, supplier_id, amount, expense_date, payment_method,
          reference_number, description, is_recurring, recurrence_day } = data;

  const category = await ExpenseCategory.findOne({ where: { id: category_id, organization_id: organizationId } });
  if (!category) throw new AppError('Categoría de gasto no encontrada.', 404);

  return await Expense.create({
    organization_id: organizationId,
    category_id,
    user_id:         userId,
    supplier_id:     supplier_id || null,
    amount:          parseFloat(amount),
    expense_date:    expense_date || new Date(),
    payment_method:  payment_method || 'cash',
    reference_number,
    description,
    is_recurring:    is_recurring  || false,
    recurrence_day:  is_recurring ? recurrence_day : null,
  });
};

const cancel = async (id, organizationId) => {
  const expense = await Expense.findOne({ where: { id, organization_id: organizationId } });
  if (!expense) throw new AppError('Gasto no encontrado.', 404);
  if (expense.status === 'cancelled') throw new AppError('El gasto ya está cancelado.', 400);
  await expense.update({ status: 'cancelled' });
  return getById(id, organizationId);
};

// ── Expense Categories ──────────────────────────────────────────

const listCategories = async (organizationId) => {
  return await ExpenseCategory.findAll({
    where: { organization_id: organizationId },
    order: [['name', 'ASC']],
  });
};

const createCategory = async (data, organizationId) => {
  const { name, description } = data;
  const exists = await ExpenseCategory.findOne({ where: { organization_id: organizationId, name } });
  if (exists) throw new AppError('Ya existe una categoría con ese nombre.', 409);
  return await ExpenseCategory.create({ organization_id: organizationId, name, description });
};

module.exports = { list, getById, create, cancel, listCategories, createCategory };
