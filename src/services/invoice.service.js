'use strict';

const { sequelize } = require('../config/database');
const { Invoice, InvoiceDetail, Order, OrderDetail, Product, Organization } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const TAX_RATE = 0.12;

const generateInvoiceNumber = async (organizationId) => {
  const org = await Organization.findByPk(organizationId);
  const ruc4 = org.ruc.substring(0, 4);
  const count = await Invoice.count({ where: { organization_id: organizationId } });
  const seq = String(count + 1).padStart(6, '0');
  return `FAC-${ruc4}-${seq}`;
};

const list = async (organizationId) => {
  return await Invoice.findAll({
    where: { organization_id: organizationId },
    include: [{ model: Order, as: 'order', attributes: ['id', 'status'] }],
    order: [['created_at', 'DESC']],
  });
};

const getById = async (id, organizationId) => {
  const invoice = await Invoice.findOne({
    where: { id, organization_id: organizationId },
    include: [
      { model: Order, as: 'order', attributes: ['id', 'status'] },
      {
        model: InvoiceDetail, as: 'details',
        include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'unit_price'] }],
      },
    ],
  });
  if (!invoice) throw new AppError('Factura no encontrada.', 404);
  return invoice;
};

const createFromOrder = async (orderId, organizationId) => {
  const order = await Order.findOne({
    where: { id: orderId, organization_id: organizationId },
    include: [{ model: OrderDetail, as: 'details' }],
  });
  if (!order) throw new AppError('Orden no encontrada.', 404);
  if (order.status === 'cancelled') throw new AppError('No se puede facturar una orden cancelada.', 400);

  const existing = await Invoice.findOne({ where: { order_id: orderId } });
  if (existing) throw new AppError('Esta orden ya tiene una factura generada.', 409);

  const invoice_number = await generateInvoiceNumber(organizationId);

  return await sequelize.transaction(async (t) => {
    const invoice = await Invoice.create({
      organization_id: organizationId,
      order_id:        orderId,
      invoice_number,
      subtotal:        order.subtotal,
      tax:             order.tax,
      total:           order.total,
    }, { transaction: t });

    for (const detail of order.details) {
      await InvoiceDetail.create({
        invoice_id: invoice.id,
        product_id: detail.product_id,
        quantity:   detail.quantity,
        unit_price: detail.unit_price,
        subtotal:   detail.subtotal,
      }, { transaction: t });
    }

    return invoice.id;
  }).then(id => getById(id, organizationId));
};

const createManual = async (data, organizationId) => {
  const { items } = data;
  if (!items || items.length === 0) throw new AppError('La factura debe tener al menos un ítem.', 400);

  const invoice_number = await generateInvoiceNumber(organizationId);

  return await sequelize.transaction(async (t) => {
    let subtotal = 0;
    const details = [];

    for (const item of items) {
      const product = await Product.findOne({
        where: { id: item.product_id, organization_id: organizationId, status: 'active' },
        transaction: t,
      });
      if (!product) throw new AppError(`Producto ${item.product_id} no encontrado o inactivo.`, 404);

      const itemSubtotal = parseFloat(product.unit_price) * item.quantity;
      subtotal += itemSubtotal;

      details.push({
        product_id: product.id,
        quantity:   item.quantity,
        unit_price: product.unit_price,
        subtotal:   itemSubtotal,
      });
    }

    const tax   = parseFloat((subtotal * TAX_RATE).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));

    const invoice = await Invoice.create({
      organization_id: organizationId,
      order_id:        null,
      invoice_number,
      subtotal,
      tax,
      total,
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