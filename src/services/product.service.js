'use strict';

const { Product, Category, TaxRate, PriceHistory, InventoryMovement } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const productInclude = [
  { model: Category, as: 'category', attributes: ['id', 'name'] },
  { model: TaxRate,  as: 'taxRate',  attributes: ['id', 'name', 'percentage'] },
];

const list = async (organizationId, { limit, offset } = {}) => {
  return await Product.findAndCountAll({
    where:   { organization_id: organizationId },
    include: productInclude,
    order:   [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id, organizationId) => {
  const product = await Product.findOne({
    where:   { id, organization_id: organizationId },
    include: productInclude,
  });
  if (!product) throw new AppError('Producto no encontrado.', 404);
  return product;
};

const create = async (data, organizationId) => {
  const { name, description, category_id, tax_rate_id, barcode, sku, unit,
          stock, min_stock, cost_price, unit_price } = data;

  if (category_id) {
    const cat = await Category.findOne({ where: { id: category_id, organization_id: organizationId } });
    if (!cat) throw new AppError('Categoría no encontrada.', 404);
  }

  return await Product.create({
    organization_id: organizationId,
    name, description, category_id, tax_rate_id,
    barcode, sku,
    unit:       unit       || 'unidad',
    stock:      stock      ?? 0,
    min_stock:  min_stock  ?? 0,
    cost_price: cost_price ?? 0,
    unit_price,
  });
};

const update = async (id, data, organizationId, userId) => {
  const product = await Product.findOne({ where: { id, organization_id: organizationId } });
  if (!product) throw new AppError('Producto no encontrado.', 404);

  const { name, description, category_id, tax_rate_id, barcode, sku, unit,
          min_stock, cost_price, unit_price } = data;

  // Record price history when prices change
  if (unit_price !== undefined && parseFloat(unit_price) !== parseFloat(product.unit_price)) {
    await PriceHistory.create({
      organization_id: organizationId,
      product_id:      product.id,
      price_type:      'sale',
      old_price:       product.unit_price,
      new_price:       unit_price,
      changed_by:      userId || null,
    });
  }
  if (cost_price !== undefined && parseFloat(cost_price) !== parseFloat(product.cost_price)) {
    await PriceHistory.create({
      organization_id: organizationId,
      product_id:      product.id,
      price_type:      'cost',
      old_price:       product.cost_price,
      new_price:       cost_price,
      changed_by:      userId || null,
    });
  }

  await product.update({ name, description, category_id, tax_rate_id, barcode, sku, unit, min_stock, cost_price, unit_price });
  return getById(product.id, organizationId);
};

const adjust = async (id, quantity, movement_type, reason, organizationId, userId) => {
  const product = await Product.findOne({ where: { id, organization_id: organizationId } });
  if (!product) throw new AppError('Producto no encontrado.', 404);

  // The DB trigger trg_update_stock_from_movement handles the actual stock update atomically
  const movement = await InventoryMovement.create({
    organization_id: organizationId,
    product_id:      product.id,
    movement_type,
    quantity,
    stock_before:    product.stock,  // trigger will recalculate
    stock_after:     product.stock,  // trigger will recalculate
    reason,
    user_id:         userId || null,
  });

  return movement;
};

const setStatus = async (id, status, organizationId) => {
  const product = await Product.findOne({ where: { id, organization_id: organizationId } });
  if (!product) throw new AppError('Producto no encontrado.', 404);
  await product.update({ status });
  return getById(product.id, organizationId);
};

const remove = async (id, organizationId) => {
  const product = await Product.findOne({ where: { id, organization_id: organizationId } });
  if (!product) throw new AppError('Producto no encontrado.', 404);
  await product.destroy();
};

module.exports = { list, getById, create, update, adjust, setStatus, remove };
