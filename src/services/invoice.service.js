'use strict';

const { sequelize } = require('../config/database');
const {
  Invoice, InvoiceDetail, Product, StoreCustomer, User,
  TaxRate, InventoryMovement,
} = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const invoiceInclude = [
  { model: StoreCustomer, as: 'customer', attributes: ['id', 'full_name', 'document_number', 'customer_type'] },
  { model: User,          as: 'createdBy', attributes: ['id', 'full_name'] },
];

// Genera número correlativo: 001-001-000000001
const generateInvoiceNumber = async (companyId, transaction) => {
  const last = await Invoice.findOne({
    where:       { company_id: companyId },
    order:       [['id', 'DESC']],
    lock:        transaction.LOCK.UPDATE,
    transaction,
    paranoid:    false,
  });

  const next = last
    ? parseInt(last.invoice_number.split('-')[2], 10) + 1
    : 1;

  const seq = String(next).padStart(9, '0');
  return `001-001-${seq}`;
};

const list = async (companyId, { limit, offset } = {}) => {
  return Invoice.findAndCountAll({
    where:   { company_id: companyId },
    include: invoiceInclude,
    order:   [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id, companyId) => {
  const invoice = await Invoice.findOne({
    where:   { id, company_id: companyId },
    include: [
      ...invoiceInclude,
      {
        model:   InvoiceDetail,
        as:      'details',
        include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sale_price'] }],
      },
    ],
  });
  if (!invoice) throw new AppError('Factura no encontrada.', 404);
  return invoice;
};

// Creación directa con líneas de detalle
const create = async (data, companyId, userId) => {
  const { customer_id, items } = data;
  if (!items || items.length === 0) {
    throw new AppError('La factura debe tener al menos un ítem.', 400);
  }

  return sequelize.transaction(async (t) => {
    const invoice_number = await generateInvoiceNumber(companyId, t);
    let subtotal   = 0;
    let tax_amount = 0;
    const details  = [];

    for (const item of items) {
      const product = await Product.findOne({
        where: { id: item.product_id, company_id: companyId, status: 'ACTIVE' },
        transaction: t,
      });
      if (!product) throw new AppError(`Producto ${item.product_id} no encontrado o inactivo.`, 404);

      if (product.stock < item.quantity) {
        throw new AppError(`Stock insuficiente para "${product.name}".`, 400);
      }

      // Obtener % de IVA desde el ítem, o desde el producto
      let taxPct = 0;
      let taxRateId = item.tax_rate_id ?? product.tax_rate_id;
      if (taxRateId) {
        const tr = await TaxRate.findOne({ where: { id: taxRateId, company_id: companyId }, transaction: t });
        if (tr) taxPct = parseFloat(tr.percentage);
      }

      const qty         = parseInt(item.quantity, 10);
      const unitPrice   = parseFloat(item.unit_price ?? product.sale_price);
      const lineSub     = parseFloat((unitPrice * qty).toFixed(2));
      const lineTax     = parseFloat((lineSub * taxPct / 100).toFixed(2));
      const lineTotal   = parseFloat((lineSub + lineTax).toFixed(2));

      subtotal   += lineSub;
      tax_amount += lineTax;

      details.push({
        company_id:     companyId,
        product_id:     product.id,
        tax_rate_id:    taxRateId ?? null,
        product_name:   product.name,
        quantity:       qty,
        unit_price:     unitPrice,
        tax_percentage: taxPct,
        tax_amount:     lineTax,
        line_subtotal:  lineSub,
        line_total:     lineTotal,
      });

      // Descontar stock
      await product.update({ stock: product.stock - qty }, { transaction: t });

      // Movimiento de inventario
      await InventoryMovement.create({
        company_id:     companyId,
        product_id:     product.id,
        movement_type:  'OUT',
        quantity:       qty,
        reference_type: 'SALE',
        notes:          `Venta factura ${invoice_number}`,
        created_by:     userId,
      }, { transaction: t });
    }

    subtotal   = parseFloat(subtotal.toFixed(2));
    tax_amount = parseFloat(tax_amount.toFixed(2));
    const total = parseFloat((subtotal + tax_amount).toFixed(2));

    const invoice = await Invoice.create({
      company_id:     companyId,
      customer_id:    customer_id || null,
      created_by:     userId,
      invoice_number,
      subtotal,
      tax_amount,
      total,
    }, { transaction: t });

    for (const detail of details) {
      await InvoiceDetail.create({ invoice_id: invoice.id, ...detail }, { transaction: t });
    }

    return invoice.id;
  }).then(id => getById(id, companyId));
};

const cancel = async (id, companyId) => {
  const invoice = await Invoice.findOne({ where: { id, company_id: companyId } });
  if (!invoice) throw new AppError('Factura no encontrada.', 404);
  if (invoice.status === 'CANCELLED') throw new AppError('La factura ya está cancelada.', 400);
  await invoice.update({ status: 'CANCELLED' });
  return getById(id, companyId);
};

module.exports = { list, getById, create, cancel };
