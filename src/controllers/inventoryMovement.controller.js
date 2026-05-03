'use strict';

const service = require('../services/inventoryMovement.service');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { product_id, movement_type, from, to } = req.query;
    const result = await service.list(req.user.company_id, { product_id, movement_type, from, to, limit, offset });
    res.status(200).json({ success: true, ...paginatedResponse(result, page, limit) });
  } catch (err) { next(err); }
};

const createManual = async (req, res, next) => {
  try {
    const data = await service.createManual(req.body, req.user.company_id, req.user.id);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { list, createManual };
