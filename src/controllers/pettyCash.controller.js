'use strict';

const service = require('../services/pettyCash.service');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const result = await service.list(req.user.company_id, { limit, offset });
    res.status(200).json({ success: true, ...paginatedResponse(result, page, limit) });
  } catch (err) { next(err); }
};

const getOpenSession = async (req, res, next) => {
  try {
    const data = await service.getOpenSession(req.user.company_id);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const open = async (req, res, next) => {
  try {
    const data = await service.open(req.body, req.user.company_id, req.user.id);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const close = async (req, res, next) => {
  try {
    const data = await service.close(req.params.id, req.body, req.user.company_id, req.user.id);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const listMovements = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const result = await service.listMovements(req.params.id, req.user.company_id, { limit, offset });
    res.status(200).json({ success: true, ...paginatedResponse(result, page, limit) });
  } catch (err) { next(err); }
};

const addMovement = async (req, res, next) => {
  try {
    const data = await service.addMovement(req.params.id, req.body, req.user.company_id, req.user.id);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { list, getOpenSession, open, close, listMovements, addMovement };
