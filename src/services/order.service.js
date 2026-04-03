'use strict';

const { sequelize } = require('../config/database');
const { Order, OrderDetail, Product, Client, User, InventoryMovement } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const orderInclude = [
  { model: Client, as: 'client', attributes: ['id', 'full_name', 'identification'] },
  { model: User,   as: 'user',   attributes: ['id', 'full_name', 'email'] },
];

const list = async (organizationId, userId, role, { limit, offset } = {}) => {
  const where = { organization_id: organizationId };
  if (role === 'seller') where.user_id = userId;
  return await Order.findAndCountAll({
    where,
    include: orderInclude,
    order:   [['created_at', 'DESC']],
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
      ...orderInclude,
      {
        model:   OrderDetail,
        as:      'details',
        include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'unit_price', 'unit'] }],
      },
    ],
  });
  if (!order) throw new AppError('Orden no encontrada.', 404);
  return order;
};

const create = async (data, organizationId, userId) => {
  const { client_id, order_date, items, notes } = data;

  if (!items || items.length === 0) throw new AppError('La orden debe tener al menos un ítem.', 400);

  // Validate client belongs to org (if provided)
  if (client_id) {
    const client = await Client.findOne({ where: { id: client_id, organization_id: organizationId } });
    if (!client) throw new AppError('Cliente no encontrado.', 404);
  }

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

      const qty          = parseFloat(item.quantity);
      const unitPrice    = parseFloat(product.unit_price);
      const taxRate      = product.tax_rate_id ? parseFloat(product.taxRate?.percentage ?? 0) : 0;
      const itemSubtotal = parseFloat((unitPrice * qty).toFixed(2));
      subtotal += itemSubtotal;

      details.push({
        organization_id: organizationId,
        product_id:      product.id,
        quantity:        qty,
        unit_price:      unitPrice,
        cost_price:      parseFloat(product.cost_price),
        tax_rate:        taxRate,
        subtotal:        itemSubtotal,
      });

      // Stock deduction via inventory_movements trigger
      await InventoryMovement.create({
        organization_id: organizationId,
        product_id:      product.id,
        movement_type:   'out',
        quantity:        qty,
        stock_before:    product.stock,
        stock_after:     product.stock,
        reference_type:  'order',
        reference_id:    null,  // will be updated after order creation if needed
        user_id:         userId,
      }, { transaction: t });
    }

    const tax   = parseFloat((subtotal * 0).toFixed(2));  // tax computed per-line in details
    const total = parseFloat((subtotal + tax).toFixed(2));

    const order = await Order.create({
      organization_id: organizationId,
      client_id:       client_id || null,
      user_id:         userId,
      order_date:      order_date || new Date(),
      subtotal,
      tax,
      total,
      notes,
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
    seller:       { pending: ['confirmed'] },
    manager:      { pending: ['confirmed', 'cancelled'], confirmed: ['shipped', 'cancelled'], shipped: ['delivered', 'cancelled'] },
    admin:        { pending: ['confirmed', 'cancelled'], confirmed: ['shipped', 'cancelled'], shipped: ['delivered', 'cancelled'] },
    Administrador:{ pending: ['confirmed', 'cancelled'], confirmed: ['shipped', 'cancelled'], shipped: ['delivered', 'cancelled'] },
    Vendedor:     { pending: ['confirmed'] },
  };

  // Sellers can only confirm their own orders
  if ((role === 'seller' || role === 'Vendedor') && order.user_id !== userId) {
    throw new AppError('Solo puedes confirmar tus propias órdenes.', 403);
  }

  const allowed = transitions[role]?.[current] ?? [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(`No se puede cambiar de '${current}' a '${newStatus}'.`, 400);
  }

  if (newStatus === 'cancelled') {
    await sequelize.transaction(async (t) => {
      const details = await OrderDetail.findAll({ where: { order_id: id }, transaction: t });
      for (const detail of details) {
        const product = await Product.findByPk(detail.product_id, { transaction: t, lock: true });
        if (product) {
          await InventoryMovement.create({
            organization_id: organizationId,
            product_id:      product.id,
            movement_type:   'in',
            quantity:        parseFloat(detail.quantity),
            stock_before:    product.stock,
            stock_after:     product.stock,
            reference_type:  'order_cancel',
            reference_id:    id,
            user_id:         userId,
          }, { transaction: t });
        }
      }
      await order.update({ status: newStatus }, { transaction: t });
    });
  } else {
    await order.update({ status: newStatus });
  }

  return getById(id, organizationId, userId, 'admin');
};

module.exports = { list, getById, create, updateStatus };
