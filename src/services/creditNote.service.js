'use strict';

const { sequelize } = require('../config/database');
const { CreditNote, CreditNoteDetail, Invoice, Product, Organization, User } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const generateCreditNoteNumber = async (organizationId, transaction) => {
  const org = await Organization.findByPk(organizationId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  const next = (org.sri_secuencial_nc || 0) + 1;
  await org.update({ sri_secuencial_nc: next }, { transaction });
  const seq = String(next).padStart(9, '0');
  return `${org.sri_establecimiento}-${org.sri_punto_emision}-NC-${seq}`;
};

const list = async (organizationId, { limit, offset } = {}) => {
  return await CreditNote.findAndCountAll({
    where:   { organization_id: organizationId },
    include: [
      { model: Invoice, as: 'invoice', attributes: ['id', 'invoice_number'] },
      { model: User,    as: 'user',    attributes: ['id', 'full_name'] },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id, organizationId) => {
  const cn = await CreditNote.findOne({
    where:   { id, organization_id: organizationId },
    include: [
      { model: Invoice, as: 'invoice', attributes: ['id', 'invoice_number', 'total'] },
      { model: User,    as: 'user',    attributes: ['id', 'full_name'] },
      {
        model:   CreditNoteDetail,
        as:      'details',
        include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }],
      },
    ],
  });
  if (!cn) throw new AppError('Nota de crédito no encontrada.', 404);
  return cn;
};

const create = async (data, organizationId, userId) => {
  const { invoice_id, reason, items } = data;
  if (!items || items.length === 0) throw new AppError('La nota de crédito debe tener al menos un ítem.', 400);

  const invoice = await Invoice.findOne({ where: { id: invoice_id, organization_id: organizationId } });
  if (!invoice) throw new AppError('Factura no encontrada.', 404);
  if (invoice.status === 'cancelled') throw new AppError('No se puede crear N/C sobre una factura cancelada.', 400);

  return await sequelize.transaction(async (t) => {
    const credit_note_number = await generateCreditNoteNumber(organizationId, t);
    let subtotal = 0;
    const details = [];

    for (const item of items) {
      const product = await Product.findOne({
        where: { id: item.product_id, organization_id: organizationId },
        transaction: t,
      });
      if (!product) throw new AppError(`Producto ${item.product_id} no encontrado.`, 404);

      const qty          = parseFloat(item.quantity);
      const unitPrice    = parseFloat(item.unit_price ?? product.unit_price);
      const itemSubtotal = parseFloat((qty * unitPrice).toFixed(2));
      subtotal += itemSubtotal;

      details.push({
        organization_id: organizationId,
        product_id:      product.id,
        quantity:        qty,
        unit_price:      unitPrice,
        tax_rate:        0,
        subtotal:        itemSubtotal,
      });
    }

    const cn = await CreditNote.create({
      organization_id:     organizationId,
      invoice_id,
      user_id:             userId,
      credit_note_number,
      reason,
      subtotal,
      tax:                 0,
      total:               subtotal,
    }, { transaction: t });

    for (const detail of details) {
      await CreditNoteDetail.create({ credit_note_id: cn.id, ...detail }, { transaction: t });
    }

    return cn.id;
  }).then(id => getById(id, organizationId));
};

const setStatus = async (id, status, organizationId) => {
  const cn = await CreditNote.findOne({ where: { id, organization_id: organizationId } });
  if (!cn) throw new AppError('Nota de crédito no encontrada.', 404);
  if (cn.status === 'cancelled') throw new AppError('No se puede modificar una nota cancelada.', 400);
  await cn.update({ status });
  return getById(id, organizationId);
};

module.exports = { list, getById, create, setStatus };
