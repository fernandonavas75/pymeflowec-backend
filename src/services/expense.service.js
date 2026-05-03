'use strict';

const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { Expense, ExpenseCategory, ExpensePayment, Supplier, User } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const expenseInclude = [
  { model: ExpenseCategory, as: 'category', attributes: ['id', 'name', 'category_type'] },
  { model: Supplier,        as: 'supplier', attributes: ['id', 'name', 'ruc'], required: false },
  { model: User,            as: 'creator',  attributes: ['id', 'full_name'] },
];

const list = async (companyId, { payment_status, category_id, from, to, limit, offset } = {}) => {
  const where = { company_id: companyId };
  if (payment_status) where.payment_status = payment_status;
  if (category_id)    where.category_id    = category_id;
  if (from || to) {
    where.expense_date = {};
    if (from) where.expense_date[Op.gte] = from;
    if (to)   where.expense_date[Op.lte] = to;
  }

  return Expense.findAndCountAll({
    where,
    include: expenseInclude,
    order:   [['expense_date', 'DESC'], ['id', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id, companyId) => {
  const expense = await Expense.findOne({
    where: { id, company_id: companyId },
    include: [
      ...expenseInclude,
      {
        model:   ExpensePayment,
        as:      'payments',
        include: [{ model: User, as: 'creator', attributes: ['id', 'full_name'] }],
      },
    ],
  });
  if (!expense) throw new AppError('Egreso no encontrado.', 404);
  return expense;
};

const create = async (data, companyId, userId) => {
  const {
    category_id, supplier_id, supplier_name_free, description,
    expense_date, amount, voucher_number, voucher_type, notes,
  } = data;

  if (!supplier_id && !supplier_name_free) {
    throw new AppError('Debe indicar supplier_id o supplier_name_free.', 400);
  }

  return Expense.create({
    company_id:         companyId,
    category_id,
    supplier_id:        supplier_id ?? null,
    supplier_name_free: supplier_name_free ?? null,
    description,
    expense_date:       expense_date ?? new Date(),
    amount,
    voucher_number:     voucher_number ?? null,
    voucher_type:       voucher_type ?? null,
    notes:              notes ?? null,
    payment_status:     'PENDIENTE',
    created_by:         userId,
  });
};

const update = async (id, data, companyId) => {
  const expense = await Expense.findOne({ where: { id, company_id: companyId } });
  if (!expense) throw new AppError('Egreso no encontrado.', 404);
  if (expense.payment_status === 'ANULADO') throw new AppError('No se puede editar un egreso anulado.', 400);

  const allowed = ['category_id','supplier_id','supplier_name_free','description',
                   'expense_date','amount','voucher_number','voucher_type','notes'];
  const patch = {};
  for (const key of allowed) {
    if (data[key] !== undefined) patch[key] = data[key];
  }
  await expense.update(patch);
  return getById(id, companyId);
};

const annul = async (id, companyId) => {
  return sequelize.transaction(async (t) => {
    const expense = await Expense.findOne({ where: { id, company_id: companyId }, transaction: t });
    if (!expense) throw new AppError('Egreso no encontrado.', 404);
    if (expense.payment_status === 'ANULADO') throw new AppError('El egreso ya está anulado.', 400);

    await ExpensePayment.update(
      { status: 'ANULADO' },
      { where: { expense_id: id, company_id: companyId, status: { [Op.ne]: 'ANULADO' } }, transaction: t },
    );
    await expense.update({ payment_status: 'ANULADO' }, { transaction: t });
    return expense;
  });
};

module.exports = { list, getById, create, update, annul };
