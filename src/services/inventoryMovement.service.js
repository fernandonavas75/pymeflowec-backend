'use strict';

const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { InventoryMovement, Product, User } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const list = async (companyId, { product_id, movement_type, from, to, limit, offset } = {}) => {
  const where = { company_id: companyId };
  if (product_id)    where.product_id    = product_id;
  if (movement_type) where.movement_type = movement_type;
  if (from || to) {
    where.created_at = {};
    if (from) where.created_at[Op.gte] = from;
    if (to)   where.created_at[Op.lte] = to;
  }

  return InventoryMovement.findAndCountAll({
    where,
    include: [
      { model: Product, as: 'product',   attributes: ['id', 'name', 'sku', 'stock'] },
      { model: User,    as: 'createdBy', attributes: ['id', 'full_name'] },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const createManual = async (data, companyId, userId) => {
  const { product_id, movement_type, quantity, reference_type, notes } = data;

  return sequelize.transaction(async (t) => {
    const product = await Product.findOne({
      where: { id: product_id, company_id: companyId, status: 'ACTIVE' },
      lock:  t.LOCK.UPDATE,
      transaction: t,
    });
    if (!product) throw new AppError('Producto no encontrado o inactivo.', 404);

    let newStock = product.stock;
    if (movement_type === 'IN') {
      newStock += quantity;
    } else if (movement_type === 'OUT') {
      if (product.stock < quantity) throw new AppError('Stock insuficiente.', 400);
      newStock -= quantity;
    } else {
      // ADJUSTMENT: quantity es el nuevo valor absoluto no el delta — se usa notes para delta
      newStock = quantity;
    }

    await product.update({ stock: newStock }, { transaction: t });

    return InventoryMovement.create({
      company_id:     companyId,
      product_id,
      movement_type,
      quantity,
      reference_type: reference_type ?? 'MANUAL',
      notes:          notes ?? null,
      created_by:     userId,
    }, { transaction: t });
  });
};

module.exports = { list, createManual };
