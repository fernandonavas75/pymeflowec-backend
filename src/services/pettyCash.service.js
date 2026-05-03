'use strict';

const { sequelize } = require('../config/database');
const { PettyCash, PettyCashMovement, ExpenseCategory, User } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const _getOpen = async (companyId, transaction) => {
  return PettyCash.findOne({
    where: { company_id: companyId, status: 'OPEN' },
    transaction,
  });
};

const list = async (companyId, { limit, offset } = {}) => {
  return PettyCash.findAndCountAll({
    where: { company_id: companyId },
    include: [
      { model: User, as: 'openedBy', attributes: ['id', 'full_name'] },
      { model: User, as: 'closedBy', attributes: ['id', 'full_name'], required: false },
    ],
    order: [['opened_at', 'DESC']],
    limit,
    offset,
  });
};

const getOpenSession = async (companyId) => {
  const pc = await PettyCash.findOne({
    where: { company_id: companyId, status: 'OPEN' },
    include: [{ model: User, as: 'openedBy', attributes: ['id', 'full_name'] }],
  });
  if (!pc) throw new AppError('No hay sesión de caja chica abierta.', 404);
  return pc;
};

const open = async (data, companyId, userId) => {
  const existing = await _getOpen(companyId, null);
  if (existing) throw new AppError('Ya existe una sesión de caja chica abierta.', 409);

  const { opening_amount, name, notes } = data;
  return PettyCash.create({
    company_id:      companyId,
    name:            name ?? 'Caja Chica',
    opening_amount,
    current_balance: opening_amount,
    status:          'OPEN',
    opened_by:       userId,
    opened_at:       new Date(),
    notes:           notes ?? null,
  });
};

const close = async (id, data, companyId, userId) => {
  return sequelize.transaction(async (t) => {
    const pc = await PettyCash.findOne({ where: { id, company_id: companyId }, transaction: t });
    if (!pc) throw new AppError('Sesión de caja chica no encontrada.', 404);
    if (pc.status === 'CLOSED') throw new AppError('La sesión ya está cerrada.', 400);

    const { closing_amount_reported, notes } = data;
    await pc.update({
      status:                  'CLOSED',
      closed_by:               userId,
      closed_at:               new Date(),
      closing_amount_reported: closing_amount_reported ?? null,
      ...(notes !== undefined && { notes }),
    }, { transaction: t });

    return pc;
  });
};

const listMovements = async (pettyCashId, companyId, { limit, offset } = {}) => {
  const pc = await PettyCash.findOne({ where: { id: pettyCashId, company_id: companyId } });
  if (!pc) throw new AppError('Sesión de caja chica no encontrada.', 404);

  return PettyCashMovement.findAndCountAll({
    where: { petty_cash_id: pettyCashId, company_id: companyId },
    include: [
      { model: ExpenseCategory, as: 'category', attributes: ['id', 'name'], required: false },
      { model: User,            as: 'creator',  attributes: ['id', 'full_name'] },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const addMovement = async (pettyCashId, data, companyId, userId) => {
  return sequelize.transaction(async (t) => {
    const pc = await PettyCash.findOne({
      where: { id: pettyCashId, company_id: companyId },
      lock:  t.LOCK.UPDATE,
      transaction: t,
    });
    if (!pc) throw new AppError('Sesión de caja chica no encontrada.', 404);
    if (pc.status === 'CLOSED') throw new AppError('La sesión de caja chica está cerrada.', 400);

    const { movement_type, category_id, amount, description, voucher_number } = data;

    let newBalance = parseFloat(pc.current_balance);
    if (movement_type === 'EXPENSE') {
      if (newBalance < parseFloat(amount)) throw new AppError('Saldo insuficiente en caja chica.', 400);
      newBalance -= parseFloat(amount);
    } else {
      newBalance += parseFloat(amount);
    }
    newBalance = parseFloat(newBalance.toFixed(2));

    const movement = await PettyCashMovement.create({
      petty_cash_id:  pettyCashId,
      company_id:     companyId,
      movement_type,
      category_id:    category_id ?? null,
      amount,
      description,
      voucher_number: voucher_number ?? null,
      balance_after:  newBalance,
      created_by:     userId,
    }, { transaction: t });

    await pc.update({ current_balance: newBalance }, { transaction: t });
    return movement;
  });
};

module.exports = { list, getOpenSession, open, close, listMovements, addMovement };
