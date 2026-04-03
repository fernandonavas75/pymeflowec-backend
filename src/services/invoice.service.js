'use strict';

const { sequelize } = require('../config/database');
const { Invoice, InvoiceDetail, Order, OrderDetail, Product, Client, User, Organization, Payment } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const invoiceInclude = [
  { model: Order,  as: 'order',  attributes: ['id', 'status'] },
  { model: Client, as: 'client', attributes: ['id', 'full_name', 'identification'] },
  { model: User,   as: 'user',   attributes: ['id', 'full_name'] },
];

/**
 * Increments sri_secuencial_factura on the org row (with FOR UPDATE lock)
 * and returns a formatted invoice number: 001-001-000000001
 */
const generateInvoiceNumber = async (organizationId, transaction) => {
  const org = await Organization.findByPk(organizationId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  const next = (org.sri_secuencial_factura || 0) + 1;
  await org.update({ sri_secuencial_factura: next }, { transaction });

  const seq = String(next).padStart(9, '0');
  return `${org.sri_establecimiento}-${org.sri_punto_emision}-${seq}`;
};

const list = async (organizationId, { limit, offset } = {}) => {
  return await Invoice.findAndCountAll({
    where:   { organization_id: organizationId },
    include: invoiceInclude,
    order:   [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id, organizationId) => {
  const invoice = await Invoice.findOne({
    where:   { id, organization_id: organizationId },
    include: [
      ...invoiceInclude,
      {
        model:   InvoiceDetail,
        as:      'details',
        include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'unit_price', 'unit'] }],
      },
      { model: Payment, as: 'payments', attributes: ['id', 'amount', 'payment_method', 'payment_date'] },
    ],
  });
  if (!invoice) throw new AppError('Factura no encontrada.', 404);
  return invoice;
};

const createFromOrder = async (orderId, organizationId, userId) => {
  const order = await Order.findOne({
    where:   { id: orderId, organization_id: organizationId },
    include: [{ model: OrderDetail, as: 'details' }],
  });
  if (!order) throw new AppError('Orden no encontrada.', 404);
  if (order.status === 'cancelled') throw new AppError('No se puede facturar una orden cancelada.', 400);

  const existing = await Invoice.findOne({ where: { order_id: orderId } });
  if (existing) throw new AppError('Esta orden ya tiene una factura generada.', 409);

  return await sequelize.transaction(async (t) => {
    const invoice_number = await generateInvoiceNumber(organizationId, t);

    const invoice = await Invoice.create({
      organization_id: organizationId,
      order_id:        orderId,
      client_id:       order.client_id,
      user_id:         userId,
      invoice_number,
      subtotal:        order.subtotal,
      tax:             order.tax,
      total:           order.total,
    }, { transaction: t });

    for (const detail of order.details) {
      await InvoiceDetail.create({
        organization_id: organizationId,
        invoice_id:      invoice.id,
        product_id:      detail.product_id,
        quantity:        detail.quantity,
        unit_price:      detail.unit_price,
        cost_price:      detail.cost_price,
        tax_rate:        detail.tax_rate,
        subtotal:        detail.subtotal,
      }, { transaction: t });
    }

    return invoice.id;
  }).then(id => getById(id, organizationId));
};

const createManual = async (data, organizationId, userId) => {
  const { client_id, items, due_date } = data;
  if (!items || items.length === 0) throw new AppError('La factura debe tener al menos un ítem.', 400);

  return await sequelize.transaction(async (t) => {
    const invoice_number = await generateInvoiceNumber(organizationId, t);
    let subtotal = 0;
    const details = [];

    for (const item of items) {
      const product = await Product.findOne({
        where: { id: item.product_id, organization_id: organizationId, status: 'active' },
        transaction: t,
      });
      if (!product) throw new AppError(`Producto ${item.product_id} no encontrado o inactivo.`, 404);

      const qty          = parseFloat(item.quantity);
      const unitPrice    = parseFloat(item.unit_price ?? product.unit_price);
      const itemSubtotal = parseFloat((unitPrice * qty).toFixed(2));
      subtotal += itemSubtotal;

      details.push({
        organization_id: organizationId,
        product_id:      product.id,
        quantity:        qty,
        unit_price:      unitPrice,
        cost_price:      parseFloat(product.cost_price),
        tax_rate:        0,
        subtotal:        itemSubtotal,
      });
    }

    const invoice = await Invoice.create({
      organization_id: organizationId,
      order_id:        null,
      client_id:       client_id || null,
      user_id:         userId,
      invoice_number,
      due_date:        due_date || null,
      subtotal,
      tax:             0,
      total:           subtotal,
    }, { transaction: t });

    for (const detail of details) {
      await InvoiceDetail.create({ invoice_id: invoice.id, ...detail }, { transaction: t });
    }

    return invoice.id;
  }).then(id => getById(id, organizationId));
};

const setStatus = async (id, status, organizationId) => {
  const invoice = await Invoice.findOne({ where: { id, organization_id: organizationId } });
  if (!invoice) throw new AppError('Factura no encontrada.', 404);
  if (invoice.status === 'cancelled') throw new AppError('No se puede modificar una factura cancelada.', 400);
  await invoice.update({ status });
  return getById(id, organizationId);
};

module.exports = { list, getById, createFromOrder, createManual, setStatus };
