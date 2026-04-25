'use strict';

const svc = require('../services/moduleRequest.service');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { status } = req.query;
    const companyId  = req.user.company_id;

    const result = await svc.list({ companyId, status, limit, offset });
    res.json({ success: true, ...paginatedResponse(result, page, limit) });
  } catch (err) { next(err); }
};

// Solo admin de plataforma
const listAll = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { status } = req.query;

    const result = await svc.listAll({ status, limit, offset });
    res.json({ success: true, ...paginatedResponse(result, page, limit) });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { module_id, comments } = req.body;
    const request = await svc.create({
      companyId:   req.user.company_id,
      moduleId:    module_id,
      requestedBy: req.user.id,
      comments,
    });
    res.status(201).json({ success: true, data: request });
  } catch (err) { next(err); }
};

const approve = async (req, res, next) => {
  try {
    const { expires_at } = req.body;
    const data = await svc.approve(Number(req.params.id), req.user.id, expires_at ?? null);
    res.json({ success: true, message: 'Solicitud aprobada.', data });
  } catch (err) { next(err); }
};

const reject = async (req, res, next) => {
  try {
    const data = await svc.reject(Number(req.params.id), req.user.id, req.body.comments);
    res.json({ success: true, message: 'Solicitud rechazada.', data });
  } catch (err) { next(err); }
};

const revoke = async (req, res, next) => {
  try {
    const data = await svc.revoke(Number(req.params.id), req.user.id);
    res.json({ success: true, message: 'Módulo revocado.', data });
  } catch (err) { next(err); }
};

const revokeByModule = async (req, res, next) => {
  try {
    const { company_id, module_id } = req.body;
    if (!company_id || !module_id) {
      return res.status(400).json({ success: false, message: 'Se requiere company_id y module_id.' });
    }
    const data = await svc.revokeByModule(Number(company_id), Number(module_id), req.user.id);
    res.json({ success: true, message: 'Módulo revocado.', data });
  } catch (err) { next(err); }
};

module.exports = { list, listAll, create, approve, reject, revoke, revokeByModule };
