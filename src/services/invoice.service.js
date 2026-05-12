'use strict';

const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const {
  Invoice, InvoiceDetail, InvoicePayment, Product, StoreCustomer, User,
  TaxRate, InventoryMovement, CompanyModule, Module, ExpenseCategory, Expense, Company,
} = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const _isModuleActive = async (companyId, moduleCode, transaction) => {
  const cm = await CompanyModule.findOne({
    where: { company_id: companyId, is_active: true },
    include: [{ model: Module, as: 'module', where: { code: moduleCode }, attributes: ['code'] }],
    transaction,
  });
  if (!cm) return false;
  if (cm.expires_at && cm.expires_at < new Date()) {
    await cm.update({ is_active: false }, { transaction });
    return false;
  }
  return true;
};

// Calcula amount_paid y amount_pending para un conjunto de facturas (evita N+1)
const _attachAmounts = async (invoiceRows, companyId) => {
  const ids = invoiceRows.map(i => i.id ?? i.get('id'));
  if (ids.length === 0) return invoiceRows.map(i => ({ ...(i.toJSON ? i.toJSON() : i), amount_paid: 0, amount_pending: parseFloat(i.total) }));

  const payments = await InvoicePayment.findAll({
    where: { invoice_id: { [Op.in]: ids }, company_id: companyId, status: 'COBRADO' },
    attributes: ['invoice_id', 'amount'],
  });

  const paidMap = {};
  for (const p of payments) {
    paidMap[p.invoice_id] = (paidMap[p.invoice_id] || 0) + parseFloat(p.amount);
  }

  return invoiceRows.map(inv => {
    const plain        = inv.toJSON ? inv.toJSON() : { ...inv };
    const amount_paid  = parseFloat((paidMap[plain.id] || 0).toFixed(2));
    const amount_pending = parseFloat((parseFloat(plain.total) - amount_paid).toFixed(2));
    return { ...plain, amount_paid, amount_pending };
  });
};

const invoiceInclude = [
  { model: StoreCustomer, as: 'customer', attributes: ['id', 'full_name', 'document_number', 'customer_type'] },
  { model: User,          as: 'createdBy', attributes: ['id', 'full_name'] },
];

// Genera número correlativo: XXX-YYY-000000001 (XXX/YYY configurables en invoice_settings)
const generateInvoiceNumber = async (companyId, transaction) => {
  const [company, last] = await Promise.all([
    Company.findByPk(companyId, { attributes: ['invoice_settings'], transaction }),
    Invoice.findOne({
      where:    { company_id: companyId },
      order:    [['id', 'DESC']],
      lock:     transaction.LOCK.UPDATE,
      transaction,
      paranoid: false,
    }),
  ]);

  const settings      = company?.invoice_settings ?? {};
  const establishment = settings.establishment  ?? '001';
  const emissionPoint = settings.emission_point ?? '001';

  const next = last
    ? parseInt(last.invoice_number.split('-')[2], 10) + 1
    : 1;

  const seq = String(next).padStart(9, '0');
  return `${establishment}-${emissionPoint}-${seq}`;
};

const list = async (companyId, { limit, offset } = {}) => {
  const result = await Invoice.findAndCountAll({
    where:   { company_id: companyId },
    include: invoiceInclude,
    order:   [['created_at', 'DESC']],
    limit,
    offset,
  });
  const rows = await _attachAmounts(result.rows, companyId);
  return { count: result.count, rows };
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
  const [enriched] = await _attachAmounts([invoice], companyId);
  return enriched;
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
      const discount    = parseFloat(item.discount ?? 0);
      const lineGross   = parseFloat((unitPrice * qty).toFixed(2));
      if (discount > lineGross) {
        throw new AppError(`El descuento supera el valor de la línea para "${product.name}".`, 400);
      }
      const lineSub     = parseFloat((lineGross - discount).toFixed(2));
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
        discount,
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

const cancel = async (id, companyId, userId) => {
  await sequelize.transaction(async (t) => {
    // Lock solo la fila de la factura (sin includes — FOR UPDATE no funciona con outer joins)
    const invoiceRow = await Invoice.findOne({
      where:       { id, company_id: companyId },
      lock:        t.LOCK.UPDATE,
      transaction: t,
    });
    if (!invoiceRow) throw new AppError('Factura no encontrada.', 404);
    if (invoiceRow.status === 'CANCELLED') throw new AppError('La factura ya está cancelada.', 400);

    // Cargar detalles con productos dentro de la misma transacción
    const invoice = await Invoice.findOne({
      where: { id, company_id: companyId },
      include: [{
        model:   InvoiceDetail,
        as:      'details',
        include: [{ model: Product, as: 'product' }],
      }],
      transaction: t,
    });

    // Cobros activos (no anulados)
    const payments = await InvoicePayment.findAll({
      where:       { invoice_id: id, company_id: companyId, status: { [Op.ne]: 'ANULADO' } },
      transaction: t,
    });

    // Monto efectivamente cobrado (status COBRADO)
    const amountPaid = parseFloat(
      payments
        .filter(p => p.status === 'COBRADO')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0)
        .toFixed(2)
    );

    // ── 1. Restaurar stock si MOD_INVENTORY está activo ───────────────
    const hasInventory = await _isModuleActive(companyId, 'MOD_INVENTORY', t);
    if (hasInventory) {
      for (const detail of invoice.details) {
        await detail.product.increment('stock', { by: detail.quantity, transaction: t });
        await InventoryMovement.create({
          company_id:     companyId,
          product_id:     detail.product_id,
          movement_type:  'IN',
          quantity:       detail.quantity,
          reference_type: 'MANUAL',
          reference_id:   invoice.id,
          notes:          `Devolución por cancelación de factura ${invoice.invoice_number}`,
          created_by:     userId,
        }, { transaction: t });
      }
    }

    // ── 2. Anular todos los cobros pendientes / cobrados ─────────────
    for (const payment of payments) {
      await payment.update({ status: 'ANULADO' }, { transaction: t });
    }

    // ── 3. Egreso imprevisto si hubo dinero ya cobrado ────────────────
    if (amountPaid > 0) {
      const hasFinance = await _isModuleActive(companyId, 'MOD_FINANCE', t);
      if (hasFinance) {
        // Buscar categoría IMPREVISTO activa; crearla si no existe
        let category = await ExpenseCategory.findOne({
          where:       { company_id: companyId, category_type: 'IMPREVISTO', is_active: true },
          transaction: t,
        });
        if (!category) {
          category = await ExpenseCategory.create({
            company_id:    companyId,
            name:          'Imprevistos',
            category_type: 'IMPREVISTO',
            description:   'Gastos imprevistos y pérdidas no planificadas',
          }, { transaction: t });
        }

        await Expense.create({
          company_id:     companyId,
          category_id:    category.id,
          description:    `Pérdida por cancelación de factura ${invoice.invoice_number}`,
          amount:         amountPaid,
          expense_date:   new Date().toISOString().split('T')[0],
          voucher_number: invoice.invoice_number,
          voucher_type:   'OTRO',
          payment_status: 'PAGADO',
          notes:          `Egreso automático. Monto cobrado no recuperable al cancelar la factura ${invoice.invoice_number}.`,
          created_by:     userId,
        }, { transaction: t });
      }
    }

    // ── 4. Cancelar la factura — resetear payment_status a PENDIENTE ─
    // (todos los cobros fueron anulados; el enum no tiene ANULADO para payment_status)
    await invoice.update({ status: 'CANCELLED', payment_status: 'PENDIENTE' }, { transaction: t });
  });

  return getById(id, companyId);
};

module.exports = { list, getById, create, cancel };
