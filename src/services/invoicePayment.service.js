'use strict';

const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { InvoicePayment, Invoice, User } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const _recalcInvoicePaymentStatus = async (invoiceId, companyId, transaction) => {
  const invoice = await Invoice.findOne({ where: { id: invoiceId, company_id: companyId }, transaction });
  if (!invoice) return;

  const payments = await InvoicePayment.findAll({
    where: { invoice_id: invoiceId, company_id: companyId, status: { [Op.ne]: 'ANULADO' } },
    transaction,
  });

  const paid = payments
    .filter(p => p.status === 'COBRADO')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  let paymentStatus;
  if (paid <= 0) {
    paymentStatus = 'PENDIENTE';
  } else if (paid >= parseFloat(invoice.total)) {
    paymentStatus = 'COBRADO';
  } else {
    paymentStatus = 'PARCIAL';
  }

  await invoice.update({ payment_status: paymentStatus }, { transaction });
};

const list = async (companyId, { invoiceId, limit, offset } = {}) => {
  const where = { company_id: companyId };
  if (invoiceId) where.invoice_id = invoiceId;

  return InvoicePayment.findAndCountAll({
    where,
    include: [{ model: User, as: 'creator', attributes: ['id', 'full_name'] }],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id, companyId) => {
  const payment = await InvoicePayment.findOne({
    where: { id, company_id: companyId },
    include: [{ model: User, as: 'creator', attributes: ['id', 'full_name'] }],
  });
  if (!payment) throw new AppError('Pago de factura no encontrado.', 404);
  return payment;
};

const create = async (data, companyId, userId) => {
  const { invoice_id, amount, payment_method, payment_date, transfer_reference,
          card_contrapartida, cheque_number, installment_number, installment_total,
          due_date, status, notes } = data;

  return sequelize.transaction(async (t) => {
    const invoice = await Invoice.findOne({
      where: { id: invoice_id, company_id: companyId },
      transaction: t,
    });
    if (!invoice) throw new AppError('Factura no encontrada.', 404);
    if (invoice.status === 'CANCELLED') throw new AppError('No se puede registrar pagos en una factura cancelada.', 400);
    if (invoice.payment_status === 'COBRADO') throw new AppError('La factura ya está completamente cobrada.', 400);

    const payment = await InvoicePayment.create({
      invoice_id,
      company_id: companyId,
      amount,
      payment_method,
      payment_date:       payment_date ?? new Date(),
      transfer_reference: transfer_reference ?? null,
      card_contrapartida: card_contrapartida ?? null,
      cheque_number:      cheque_number ?? null,
      installment_number: installment_number ?? null,
      installment_total:  installment_total ?? null,
      due_date:           due_date ?? null,
      status:             status ?? 'COBRADO',
      notes:              notes ?? null,
      created_by: userId,
    }, { transaction: t });

    await _recalcInvoicePaymentStatus(invoice_id, companyId, t);
    return payment;
  });
};

const annul = async (id, companyId) => {
  return sequelize.transaction(async (t) => {
    const payment = await InvoicePayment.findOne({ where: { id, company_id: companyId }, transaction: t });
    if (!payment) throw new AppError('Pago no encontrado.', 404);
    if (payment.status === 'ANULADO') throw new AppError('El pago ya está anulado.', 400);

    await payment.update({ status: 'ANULADO' }, { transaction: t });
    await _recalcInvoicePaymentStatus(payment.invoice_id, companyId, t);
    return payment;
  });
};

module.exports = { list, getById, create, annul };
