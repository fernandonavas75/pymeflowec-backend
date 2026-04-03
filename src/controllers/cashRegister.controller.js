'use strict';

const service = require('../services/cashRegister.service');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const result = await service.list(req.user.organization_id, { limit, offset });
    res.status(200).json({ success: true, ...paginatedResponse(result, page, limit) });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await service.getById(req.params.id, req.user.organization_id);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const open = async (req, res, next) => {
  try {
    const data = await service.open(req.body, req.user.organization_id, req.user.id);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const close = async (req, res, next) => {
  try {
    const data = await service.close(req.params.id, req.body, req.user.organization_id, req.user.id);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const addMovement = async (req, res, next) => {
  try {
    const data = await service.addMovement(req.params.id, req.body, req.user.organization_id);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { list, getById, open, close, addMovement };
