'use strict';

const service = require('../services/invoicePayment.service');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const invoiceId = req.query.invoice_id ? parseInt(req.query.invoice_id, 10) : undefined;
    const result = await service.list(req.user.company_id, { invoiceId, limit, offset });
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

const annul = async (req, res, next) => {
  try {
    const data = await service.annul(req.params.id, req.user.company_id);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { list, getById, create, annul };
