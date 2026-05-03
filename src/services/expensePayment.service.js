'use strict';

const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { ExpensePayment, Expense, User } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const _recalcExpensePaymentStatus = async (expenseId, companyId, transaction) => {
  const expense = await Expense.findOne({ where: { id: expenseId, company_id: companyId }, transaction });
  if (!expense) return;

  const payments = await ExpensePayment.findAll({
    where: { expense_id: expenseId, company_id: companyId, status: { [Op.ne]: 'ANULADO' } },
    transaction,
  });

  const paid = payments
    .filter(p => p.status === 'PAGADO')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  let paymentStatus;
  if (paid <= 0) {
    paymentStatus = 'PENDIENTE';
  } else if (paid >= parseFloat(expense.amount)) {
    paymentStatus = 'PAGADO';
  } else {
    paymentStatus = 'PARCIAL';
  }

  await expense.update({ payment_status: paymentStatus }, { transaction });
};

const list = async (companyId, { expenseId, limit, offset } = {}) => {
  const where = { company_id: companyId };
  if (expenseId) where.expense_id = expenseId;

  return ExpensePayment.findAndCountAll({
    where,
    include: [{ model: User, as: 'creator', attributes: ['id', 'full_name'] }],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id, companyId) => {
  const payment = await ExpensePayment.findOne({
    where: { id, company_id: companyId },
    include: [{ model: User, as: 'creator', attributes: ['id', 'full_name'] }],
  });
  if (!payment) throw new AppError('Pago de egreso no encontrado.', 404);
  return payment;
};

const create = async (data, companyId, userId) => {
  const { expense_id, amount, payment_method, payment_date, transfer_reference,
          card_contrapartida, cheque_number, installment_number, installment_total,
          due_date, status, notes } = data;

  return sequelize.transaction(async (t) => {
    const expense = await Expense.findOne({ where: { id: expense_id, company_id: companyId }, transaction: t });
    if (!expense) throw new AppError('Egreso no encontrado.', 404);
    if (expense.payment_status === 'ANULADO') throw new AppError('No se puede registrar pagos en un egreso anulado.', 400);
    if (expense.payment_status === 'PAGADO')  throw new AppError('El egreso ya está completamente pagado.', 400);

    const payment = await ExpensePayment.create({
      expense_id,
      company_id:         companyId,
      amount,
      payment_method,
      payment_date:       payment_date ?? new Date(),
      transfer_reference: transfer_reference ?? null,
      card_contrapartida: card_contrapartida ?? null,
      cheque_number:      cheque_number ?? null,
      installment_number: installment_number ?? null,
      installment_total:  installment_total ?? null,
      due_date:           due_date ?? null,
      status:             status ?? 'PAGADO',
      notes:              notes ?? null,
      created_by:         userId,
    }, { transaction: t });

    await _recalcExpensePaymentStatus(expense_id, companyId, t);
    return payment;
  });
};

const annul = async (id, companyId) => {
  return sequelize.transaction(async (t) => {
    const payment = await ExpensePayment.findOne({ where: { id, company_id: companyId }, transaction: t });
    if (!payment) throw new AppError('Pago no encontrado.', 404);
    if (payment.status === 'ANULADO') throw new AppError('El pago ya está anulado.', 400);

    await payment.update({ status: 'ANULADO' }, { transaction: t });
    await _recalcExpensePaymentStatus(payment.expense_id, companyId, t);
    return payment;
  });
};

module.exports = { list, getById, create, annul };
