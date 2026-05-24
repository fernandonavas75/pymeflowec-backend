'use strict';

const { Product, ProductCategory, Supplier, TaxRate, InventoryMovement } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const productInclude = [
  { model: ProductCategory, as: 'category', attributes: ['id', 'name'] },
  { model: Supplier,        as: 'supplier', attributes: ['id', 'name'] },
  { model: TaxRate,         as: 'taxRate',  attributes: ['id', 'tax_name', 'percentage'] },
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
  const { name, description, sku, category_id, supplier_id, tax_rate_id,
          purchase_price, sale_price, stock, min_stock } = data;

  if (category_id) {
    const cat = await ProductCategory.findOne({ where: { id: category_id, company_id: companyId } });
    if (!cat) throw new AppError('Categoría no encontrada.', 404);
  }
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
    name, description, sku, category_id, supplier_id, tax_rate_id,
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

  const { name, description, sku, category_id, supplier_id, tax_rate_id,
          purchase_price, sale_price, min_stock, status } = data;

  await product.update({ name, description, sku, category_id, supplier_id, tax_rate_id,
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

const bulkCreate = async (productsData, companyId) => {
  // Pre-carga de IDs válidos para evitar N+1 queries por fila
  const [suppliers, taxRates] = await Promise.all([
    Supplier.findAll({ where: { company_id: companyId }, attributes: ['id'] }),
    TaxRate.findAll({ where: { company_id: companyId }, attributes: ['id'] }),
  ]);

  const validSupplierIds = new Set(suppliers.map(s => Number(s.id)));
  const validTaxRateIds  = new Set(taxRates.map(t => Number(t.id)));

  const created = [];
  const failed  = [];

  for (let i = 0; i < productsData.length; i++) {
    const row    = productsData[i];
    const rowNum = i + 1;
    const errors = [];

    // ── Validación por fila ─────────────────────────────────────────
    const name = row.name ? String(row.name).trim() : '';
    if (!name)             errors.push('El nombre es requerido.');
    else if (name.length < 2)   errors.push('El nombre debe tener al menos 2 caracteres.');
    else if (name.length > 150) errors.push('El nombre no puede superar 150 caracteres.');

    const salePrice = parseFloat(row.unit_price);
    if (isNaN(salePrice) || salePrice < 0)
      errors.push('El precio de venta (unit_price) debe ser un número >= 0.');

    const purchasePrice = (row.cost_price != null && row.cost_price !== '')
      ? parseFloat(row.cost_price) : 0;
    if (isNaN(purchasePrice) || purchasePrice < 0)
      errors.push('El precio de costo (cost_price) debe ser un número >= 0.');

    const stock = (row.stock != null && row.stock !== '') ? parseInt(row.stock, 10) : 0;
    if (isNaN(stock) || stock < 0)
      errors.push('El stock debe ser un entero >= 0.');

    const minStock = (row.min_stock != null && row.min_stock !== '') ? parseInt(row.min_stock, 10) : 0;
    if (isNaN(minStock) || minStock < 0)
      errors.push('El stock mínimo debe ser un entero >= 0.');

    const supplierId = (row.supplier_id != null && row.supplier_id !== '')
      ? Number(row.supplier_id) : null;
    if (supplierId !== null) {
      if (!Number.isInteger(supplierId) || supplierId < 1)
        errors.push('supplier_id debe ser un entero positivo.');
      else if (!validSupplierIds.has(supplierId))
        errors.push(`Proveedor con id ${supplierId} no encontrado en esta empresa.`);
    }

    const taxRateId = (row.tax_rate_id != null && row.tax_rate_id !== '')
      ? Number(row.tax_rate_id) : null;
    if (taxRateId !== null) {
      if (!Number.isInteger(taxRateId) || taxRateId < 1)
        errors.push('tax_rate_id debe ser un entero positivo.');
      else if (!validTaxRateIds.has(taxRateId))
        errors.push(`Tasa de impuesto con id ${taxRateId} no encontrada en esta empresa.`);
    }

    if (errors.length > 0) {
      failed.push({ row: rowNum, name: row.name || '', errors });
      continue;
    }

    // ── Inserción ───────────────────────────────────────────────────
    try {
      const product = await Product.create({
        company_id:     companyId,
        name,
        description:    row.description ? String(row.description).trim() : null,
        sku:            row.sku         ? String(row.sku).trim()          : null,
        supplier_id:    supplierId,
        tax_rate_id:    taxRateId,
        sale_price:     salePrice,
        purchase_price: purchasePrice,
        stock,
        min_stock:      minStock,
      });
      created.push(product.id);
    } catch (err) {
      const msg = err.errors?.[0]?.message || 'Error al crear el producto.';
      failed.push({ row: rowNum, name: row.name || '', errors: [msg] });
    }
  }

  return { created_count: created.length, failed_count: failed.length, failed };
};

module.exports = { list, getById, create, update, adjust, setStatus, remove, bulkCreate };
