'use strict';

const { CashRegister, CashRegisterMovement, User } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const list = async (organizationId, { limit, offset } = {}) => {
  return await CashRegister.findAndCountAll({
    where:   { organization_id: organizationId },
    include: [{ model: User, as: 'user', attributes: ['id', 'full_name'] }],
    order:   [['opened_at', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id, organizationId) => {
  const cr = await CashRegister.findOne({
    where:   { id, organization_id: organizationId },
    include: [
      { model: User, as: 'user', attributes: ['id', 'full_name'] },
      { model: CashRegisterMovement, as: 'movements', order: [['created_at', 'ASC']] },
    ],
  });
  if (!cr) throw new AppError('Caja no encontrada.', 404);
  return cr;
};

const open = async (data, organizationId, userId) => {
  const existing = await CashRegister.findOne({
    where: { organization_id: organizationId, user_id: userId, status: 'open' },
  });
  if (existing) throw new AppError('Ya tienes una caja abierta.', 409);

  return await CashRegister.create({
    organization_id: organizationId,
    user_id:         userId,
    opening_amount:  parseFloat(data.opening_amount ?? 0),
  });
};

const close = async (id, data, organizationId, userId) => {
  const cr = await CashRegister.findOne({ where: { id, organization_id: organizationId } });
  if (!cr) throw new AppError('Caja no encontrada.', 404);
  if (cr.status === 'closed') throw new AppError('La caja ya está cerrada.', 400);

  // Calculate expected from movements
  const movements = await CashRegisterMovement.findAll({ where: { cash_register_id: id } });
  const expected  = movements.reduce((sum, m) => {
    return ['sale', 'deposit'].includes(m.movement_type)
      ? sum + parseFloat(m.amount)
      : sum - parseFloat(m.amount);
  }, parseFloat(cr.opening_amount));

  const actual     = parseFloat(data.actual_amount ?? expected);
  const difference = parseFloat((actual - expected).toFixed(2));

  await cr.update({
    status:          'closed',
    closed_at:       new Date(),
    expected_amount: parseFloat(expected.toFixed(2)),
    actual_amount:   actual,
    difference,
    notes:           data.notes || null,
  });

  return getById(id, organizationId);
};

const addMovement = async (id, data, organizationId) => {
  const cr = await CashRegister.findOne({ where: { id, organization_id: organizationId } });
  if (!cr) throw new AppError('Caja no encontrada.', 404);
  if (cr.status === 'closed') throw new AppError('La caja está cerrada.', 400);

  return await CashRegisterMovement.create({
    organization_id:  organizationId,
    cash_register_id: id,
    movement_type:    data.movement_type,
    amount:           parseFloat(data.amount),
    description:      data.description || null,
  });
};

module.exports = { list, getById, open, close, addMovement };
