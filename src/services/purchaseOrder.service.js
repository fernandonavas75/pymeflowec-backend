'use strict';

const { sequelize } = require('../config/database');
const { PurchaseOrder, PurchaseOrderDetail, Supplier, Product, User, InventoryMovement } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const poInclude = [
  { model: Supplier, as: 'supplier', attributes: ['id', 'business_name'] },
  { model: User,     as: 'user',     attributes: ['id', 'full_name'] },
];

const list = async (organizationId, { limit, offset } = {}) => {
  return await PurchaseOrder.findAndCountAll({
    where:   { organization_id: organizationId },
    include: poInclude,
    order:   [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id, organizationId) => {
  const po = await PurchaseOrder.findOne({
    where:   { id, organization_id: organizationId },
    include: [
      ...poInclude,
      {
        model:   PurchaseOrderDetail,
        as:      'details',
        include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'unit'] }],
      },
    ],
  });
  if (!po) throw new AppError('Orden de compra no encontrada.', 404);
  return po;
};

const create = async (data, organizationId, userId) => {
  const { supplier_id, order_date, expected_date, items, notes } = data;
  if (!items || items.length === 0) throw new AppError('La orden debe tener al menos un ítem.', 400);

  const supplier = await Supplier.findOne({ where: { id: supplier_id, organization_id: organizationId } });
  if (!supplier) throw new AppError('Proveedor no encontrado.', 404);

  return await sequelize.transaction(async (t) => {
    let subtotal = 0;
    const details = [];

    for (const item of items) {
      const product = await Product.findOne({
        where: { id: item.product_id, organization_id: organizationId },
        transaction: t,
      });
      if (!product) throw new AppError(`Producto ${item.product_id} no encontrado.`, 404);

      const qty          = parseFloat(item.quantity_ordered);
      const unitCost     = parseFloat(item.unit_cost);
      const itemSubtotal = parseFloat((qty * unitCost).toFixed(2));
      subtotal += itemSubtotal;

      details.push({
        organization_id:   organizationId,
        product_id:        product.id,
        quantity_ordered:  qty,
        quantity_received: 0,
        unit_cost:         unitCost,
        subtotal:          itemSubtotal,
      });
    }

    // Auto-generate PO number
    const count = await PurchaseOrder.count({ where: { organization_id: organizationId }, transaction: t });
    const po_number = `OC-${String(count + 1).padStart(6, '0')}`;

    const po = await PurchaseOrder.create({
      organization_id: organizationId,
      supplier_id,
      user_id:         userId,
      po_number,
      order_date:      order_date    || new Date(),
      expected_date:   expected_date || null,
      subtotal,
      tax:             0,
      total:           subtotal,
      notes,
    }, { transaction: t });

    for (const detail of details) {
      await PurchaseOrderDetail.create({ purchase_order_id: po.id, ...detail }, { transaction: t });
    }

    return po.id;
  }).then(id => getById(id, organizationId));
};

/**
 * Receives items into inventory and updates received quantities.
 * Generates inventory_movements (in) for each received product.
 */
const receive = async (id, receivedItems, organizationId, userId) => {
  const po = await PurchaseOrder.findOne({
    where:   { id, organization_id: organizationId },
    include: [{ model: PurchaseOrderDetail, as: 'details' }],
  });
  if (!po) throw new AppError('Orden de compra no encontrada.', 404);
  if (po.status === 'cancelled') throw new AppError('No se puede recibir una orden cancelada.', 400);
  if (po.status === 'received') throw new AppError('Esta orden ya fue recibida completamente.', 400);

  await sequelize.transaction(async (t) => {
    let allReceived = true;

    for (const item of receivedItems) {
      const detail = po.details.find(d => d.product_id === item.product_id);
      if (!detail) throw new AppError(`Producto ${item.product_id} no está en esta orden.`, 400);

      const newReceived = parseFloat(detail.quantity_received) + parseFloat(item.quantity_received);
      if (newReceived > parseFloat(detail.quantity_ordered)) {
        throw new AppError(`Cantidad recibida supera la cantidad ordenada para el producto ${item.product_id}.`, 400);
      }

      await detail.update({ quantity_received: newReceived }, { transaction: t });

      const product = await Product.findByPk(item.product_id, { transaction: t, lock: true });
      await InventoryMovement.create({
        organization_id: organizationId,
        product_id:      item.product_id,
        movement_type:   'in',
        quantity:        parseFloat(item.quantity_received),
        stock_before:    product.stock,
        stock_after:     product.stock,
        reference_type:  'purchase_order',
        reference_id:    po.id,
        user_id:         userId,
      }, { transaction: t });

      if (newReceived < parseFloat(detail.quantity_ordered)) allReceived = false;
    }

    const newStatus = allReceived ? 'received' : 'partial';
    await po.update({ status: newStatus, received_date: allReceived ? new Date() : null }, { transaction: t });
  });

  return getById(id, organizationId);
};

const updateStatus = async (id, status, organizationId) => {
  const po = await PurchaseOrder.findOne({ where: { id, organization_id: organizationId } });
  if (!po) throw new AppError('Orden de compra no encontrada.', 404);
  if (po.status === 'cancelled') throw new AppError('No se puede modificar una orden cancelada.', 400);
  if (po.status === 'received') throw new AppError('No se puede modificar una orden ya recibida.', 400);
  await po.update({ status });
  return getById(id, organizationId);
};

module.exports = { list, getById, create, receive, updateStatus };
