'use strict';

const { Product, Supplier, TaxRate, InventoryMovement } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const productInclude = [
  { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
  { model: TaxRate,  as: 'taxRate',  attributes: ['id', 'tax_name', 'percentage'] },
];

const list = async (companyId, { limit, offset } = {}) => {
  return Product.findAndCountAll({
    where:   { company_id: companyId },
    include: productInclude,
    order:   [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id, companyId) => {
  const product = await Product.findOne({
    where:   { id, company_id: companyId },
    include: productInclude,
  });
  if (!product) throw new AppError('Producto no encontrado.', 404);
  return product;
};

const create = async (data, companyId) => {
  const { name, description, sku, supplier_id, tax_rate_id,
          purchase_price, sale_price, stock, min_stock } = data;

  if (supplier_id) {
    const sup = await Supplier.findOne({ where: { id: supplier_id, company_id: companyId } });
    if (!sup) throw new AppError('Proveedor no encontrado.', 404);
  }
  if (tax_rate_id) {
    const tr = await TaxRate.findOne({ where: { id: tax_rate_id, company_id: companyId } });
    if (!tr) throw new AppError('Tasa de impuesto no encontrada.', 404);
  }

  const product = await Product.create({
    company_id: companyId,
    name, description, sku, supplier_id, tax_rate_id,
    purchase_price: purchase_price ?? 0,
    sale_price:     sale_price     ?? 0,
    stock:          stock          ?? 0,
    min_stock:      min_stock      ?? 0,
  });

  return getById(product.id, companyId);
};

const update = async (id, data, companyId) => {
  const product = await Product.findOne({ where: { id, company_id: companyId } });
  if (!product) throw new AppError('Producto no encontrado.', 404);

  const { name, description, sku, supplier_id, tax_rate_id,
          purchase_price, sale_price, min_stock, status } = data;

  await product.update({ name, description, sku, supplier_id, tax_rate_id,
                         purchase_price, sale_price, min_stock, status });
  return getById(product.id, companyId);
};

// Ajuste manual de inventario
const adjust = async (id, quantity, movement_type, notes, companyId, userId) => {
  const product = await Product.findOne({ where: { id, company_id: companyId } });
  if (!product) throw new AppError('Producto no encontrado.', 404);

  if (movement_type === 'OUT' && product.stock < quantity) {
    throw new AppError('Stock insuficiente.', 400);
  }

  const movement = await InventoryMovement.create({
    company_id:     companyId,
    product_id:     product.id,
    movement_type,
    quantity,
    reference_type: 'MANUAL',
    notes,
    created_by:     userId,
  });

  const newStock = movement_type === 'IN'
    ? product.stock + quantity
    : movement_type === 'OUT'
      ? product.stock - quantity
      : quantity; // ADJUSTMENT → set absolute
  await product.update({ stock: newStock });

  return movement;
};

const setStatus = async (id, status, companyId) => {
  const product = await Product.findOne({ where: { id, company_id: companyId } });
  if (!product) throw new AppError('Producto no encontrado.', 404);
  await product.update({ status });
  return getById(product.id, companyId);
};

const remove = async (id, companyId) => {
  const product = await Product.findOne({ where: { id, company_id: companyId } });
  if (!product) throw new AppError('Producto no encontrado.', 404);
  await product.destroy();
};

module.exports = { list, getById, create, update, adjust, setStatus, remove };
