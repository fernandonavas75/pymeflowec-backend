'use strict';

const { sequelize } = require('../config/database');
const { Payment, Invoice, CashRegisterMovement } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const list = async (organizationId, { limit, offset } = {}) => {
  return await Payment.findAndCountAll({
    where:   { organization_id: organizationId },
    include: [{ model: Invoice, as: 'invoice', attributes: ['id', 'invoice_number', 'total', 'payment_status'] }],
    order:   [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id, organizationId) => {
  const payment = await Payment.findOne({
    where:   { id, organization_id: organizationId },
    include: [{ model: Invoice, as: 'invoice', attributes: ['id', 'invoice_number', 'total', 'payment_status'] }],
  });
  if (!payment) throw new AppError('Pago no encontrado.', 404);
  return payment;
};

const create = async (data, organizationId, userId) => {
  const { invoice_id, payment_method, amount, reference_number, payment_date, notes } = data;

  const invoice = await Invoice.findOne({ where: { id: invoice_id, organization_id: organizationId } });
  if (!invoice) throw new AppError('Factura no encontrada.', 404);
  if (invoice.status === 'cancelled') throw new AppError('No se puede pagar una factura cancelada.', 400);
  if (invoice.payment_status === 'paid') throw new AppError('La factura ya está pagada completamente.', 400);

  return await sequelize.transaction(async (t) => {
    // The DB trigger before_payment_validate_cash will validate cash register if method=cash
    const payment = await Payment.create({
      organization_id: organizationId,
      invoice_id,
      user_id:         userId,
      payment_method,
      amount:          parseFloat(amount),
      reference_number,
      payment_date:    payment_date || new Date(),
      notes,
    }, { transaction: t });

    // Update invoice payment_status
    const existingPayments = await Payment.findAll({ where: { invoice_id }, transaction: t });
    const totalPaid = existingPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const invoiceTotal = parseFloat(invoice.total);

    let newPaymentStatus = 'partial';
    let newStatus = invoice.status;
    if (totalPaid >= invoiceTotal) {
      newPaymentStatus = 'paid';
      newStatus = 'paid';
    }

    await invoice.update({ payment_status: newPaymentStatus, status: newStatus }, { transaction: t });

    // Create cash register movement for cash payments
    if (payment_method === 'cash') {
      await CashRegisterMovement.create({
        organization_id: organizationId,
        cash_register_id: data.cash_register_id,
        movement_type:    'sale',
        amount:           parseFloat(amount),
        payment_id:       payment.id,
        description:      `Pago factura ${invoice.invoice_number}`,
      }, { transaction: t });
    }

    return payment.id;
  }).then(id => getById(id, organizationId));
};

module.exports = { list, getById, create };
