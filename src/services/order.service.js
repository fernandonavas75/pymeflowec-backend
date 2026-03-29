'use strict';

const { sequelize } = require('../config/database');
const { Order, OrderDetail, Product, Client, User, Organization } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const list = async (organizationId, userId, role, { limit, offset } = {}) => {
  const where = { organization_id: organizationId };
  if (role === 'seller') where.user_id = userId;
  return await Order.findAndCountAll({
    where,
    include: [
      { model: Client, as: 'client', attributes: ['id', 'full_name', 'identification'] },
      { model: User,   as: 'user',   attributes: ['id', 'full_name', 'email'] },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id, organizationId, userId, role) => {
  const where = { id, organization_id: organizationId };
  if (role === 'seller') where.user_id = userId;

  const order = await Order.findOne({
    where,
    include: [
      { model: Client,      as: 'client',  attributes: ['id', 'full_name', 'identification'] },
      { model: User,        as: 'user',    attributes: ['id', 'full_name', 'email'] },
      {
        model: OrderDetail, as: 'details',
        include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'unit_price'] }],
      },
    ],
  });
  if (!order) throw new AppError('Orden no encontrada.', 404);
  return order;
};

const create = async (data, organizationId, userId) => {
  const { client_id, order_date, items } = data;

  if (!items || items.length === 0) throw new AppError('La orden debe tener al menos un ítem.', 400);

  const [client, org] = await Promise.all([
    Client.findOne({ where: { id: client_id, organization_id: organizationId } }),
    Organization.findByPk(organizationId),
  ]);
  if (!client) throw new AppError('Cliente no encontrado.', 404);

  const taxRate = parseFloat(org.tax_rate);

  const orderId = await sequelize.transaction(async (t) => {
    let subtotal = 0;
    const details = [];

    for (const item of items) {
      const product = await Product.findOne({
        where: { id: item.product_id, organization_id: organizationId, status: 'active' },
        transaction: t,
        lock: true,
      });
      if (!product) throw new AppError(`Producto ${item.product_id} no encontrado o inactivo.`, 404);
      if (product.stock < item.quantity) throw new AppError(`Stock insuficiente para "${product.name}".`, 400);

      const itemSubtotal = parseFloat(product.unit_price) * item.quantity;
      subtotal += itemSubtotal;

      await product.update({ stock: product.stock - item.quantity }, { transaction: t });

      details.push({
        product_id: product.id,
        quantity:   item.quantity,
        unit_price: product.unit_price,
        subtotal:   itemSubtotal,
      });
    }

    const tax   = parseFloat((subtotal * taxRate).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));

    const order = await Order.create({
      organization_id: organizationId,
      client_id,
      user_id:    userId,
      order_date: order_date || new Date(),
      subtotal,
      tax,
      total,
    }, { transaction: t });

    for (const detail of details) {
      await OrderDetail.create({ order_id: order.id, ...detail }, { transaction: t });
    }

    return order.id;
  });

  return getById(orderId, organizationId, userId, 'admin');
};

const updateStatus = async (id, newStatus, organizationId, userId, role) => {
  const order = await Order.findOne({ where: { id, organization_id: organizationId } });
  if (!order) throw new AppError('Orden no encontrada.', 404);

  const current = order.status;

  const transitions = {
    seller:  { pending: ['confirmed'] },
    manager: { pending: ['confirmed', 'cancelled'], confirmed: ['shipped', 'cancelled'], shipped: ['delivered', 'cancelled'] },
    admin:   { pending: ['confirmed', 'cancelled'], confirmed: ['shipped', 'cancelled'], shipped: ['delivered', 'cancelled'] },
  };

  if (role === 'seller' && order.user_id !== userId) {
    throw new AppError('Solo puedes confirmar tus propias órdenes.', 403);
  }

  const allowed = transitions[role]?.[current] || [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(`No se puede cambiar de '${current}' a '${newStatus}'.`, 400);
  }

  if (newStatus === 'cancelled') {
    await sequelize.transaction(async (t) => {
      const details = await OrderDetail.findAll({ where: { order_id: id }, transaction: t });
      for (const detail of details) {
        const product = await Product.findByPk(detail.product_id, { transaction: t, lock: true });
        if (product) await product.update({ stock: product.stock + detail.quantity }, { transaction: t });
      }
      await order.update({ status: newStatus }, { transaction: t });
    });
  } else {
    await order.update({ status: newStatus });
  }

  return getById(id, organizationId, userId, 'admin');
};

module.exports = { list, getById, create, updateStatus };