'use strict';

const service = require('../services/expenseRecurring.service');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const is_active = req.query.is_active !== undefined
      ? req.query.is_active === 'true'
      : undefined;
    const result = await service.list(req.user.company_id, { is_active, limit, offset });
    res.status(200).json({ success: true, ...paginatedResponse(result, page, limit) });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await service.getById(req.params.id, req.user.company_id);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await service.create(req.body, req.user.company_id, req.user.id);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await service.update(req.params.id, req.body, req.user.company_id);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id, req.user.company_id);
    res.status(200).json({ success: true, message: 'Egreso recurrente eliminado.' });
  } catch (err) { next(err); }
};

module.exports = { list, getById, create, update, remove };
