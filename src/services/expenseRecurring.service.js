'use strict';

const { ExpenseRecurring, ExpenseCategory, Supplier } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const list = async (companyId, { is_active, limit, offset } = {}) => {
  const where = { company_id: companyId };
  if (is_active !== undefined) where.is_active = is_active;

  return ExpenseRecurring.findAndCountAll({
    where,
    include: [
      { model: ExpenseCategory, as: 'category', attributes: ['id', 'name', 'category_type'] },
      { model: Supplier,        as: 'supplier', attributes: ['id', 'name'], required: false },
    ],
    order: [['day_of_month', 'ASC']],
    limit,
    offset,
  });
};

const getById = async (id, companyId) => {
  const rec = await ExpenseRecurring.findOne({
    where: { id, company_id: companyId },
    include: [
      { model: ExpenseCategory, as: 'category', attributes: ['id', 'name', 'category_type'] },
      { model: Supplier,        as: 'supplier', attributes: ['id', 'name'], required: false },
    ],
  });
  if (!rec) throw new AppError('Egreso recurrente no encontrado.', 404);
  return rec;
};

const create = async (data, companyId, userId) => {
  const {
    category_id, supplier_id, supplier_name_free, description,
    amount, day_of_month, voucher_type, default_payment_method,
    starts_at, ends_at,
  } = data;

  if (!supplier_id && !supplier_name_free) {
    throw new AppError('Debe indicar supplier_id o supplier_name_free.', 400);
  }

  return ExpenseRecurring.create({
    company_id:             companyId,
    category_id,
    supplier_id:            supplier_id ?? null,
    supplier_name_free:     supplier_name_free ?? null,
    description,
    amount,
    day_of_month,
    voucher_type:           voucher_type ?? null,
    default_payment_method: default_payment_method ?? null,
    starts_at:              starts_at ?? new Date(),
    ends_at:                ends_at ?? null,
    created_by:             userId,
  });
};

const update = async (id, data, companyId) => {
  const rec = await getById(id, companyId);
  const allowed = ['category_id','supplier_id','supplier_name_free','description',
                   'amount','day_of_month','voucher_type','default_payment_method',
                   'starts_at','ends_at','is_active'];
  const patch = {};
  for (const key of allowed) {
    if (data[key] !== undefined) patch[key] = data[key];
  }
  await rec.update(patch);
  return rec;
};

const remove = async (id, companyId) => {
  const rec = await getById(id, companyId);
  await rec.destroy();
};

module.exports = { list, getById, create, update, remove };
