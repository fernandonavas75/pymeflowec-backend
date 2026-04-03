'use strict';

const service = require('../services/purchaseOrder.service');
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

const create = async (req, res, next) => {
  try {
    const data = await service.create(req.body, req.user.organization_id, req.user.id);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const receive = async (req, res, next) => {
  try {
    const data = await service.receive(req.params.id, req.body.items, req.user.organization_id, req.user.id);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const data = await service.updateStatus(req.params.id, req.body.status, req.user.organization_id);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { list, getById, create, receive, updateStatus };
