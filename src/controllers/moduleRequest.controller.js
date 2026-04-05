'use strict';

const svc        = require('../services/moduleRequest.service');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { status }              = req.query;
    const organizationId          = req.user.organization_id;

    const result = await svc.list({ organizationId, status, limit, offset });
    res.json({ success: true, ...paginatedResponse(result, page, limit) });
  } catch (err) { next(err); }
};

// Platform admin only
const listAll = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { status }              = req.query;

    const result = await svc.listAll({ status, limit, offset });
    res.json({ success: true, ...paginatedResponse(result, page, limit) });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { module_id, notes } = req.body;
    const organizationId       = req.user.organization_id;
    const requestedBy          = req.user.id;

    const request = await svc.create({ organizationId, moduleId: module_id, requestedBy, notes });
    res.status(201).json({ success: true, data: request });
  } catch (err) { next(err); }
};

const approve = async (req, res, next) => {
  try {
    await svc.approve(Number(req.params.id), req.user.id);
    res.json({ success: true, message: 'Solicitud aprobada.' });
  } catch (err) { next(err); }
};

const reject = async (req, res, next) => {
  try {
    await svc.reject(Number(req.params.id), req.user.id, req.body.reason);
    res.json({ success: true, message: 'Solicitud rechazada.' });
  } catch (err) { next(err); }
};

const cancel = async (req, res, next) => {
  try {
    const result = await svc.cancel(Number(req.params.id), req.user.organization_id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

module.exports = { list, listAll, create, approve, reject, cancel };
