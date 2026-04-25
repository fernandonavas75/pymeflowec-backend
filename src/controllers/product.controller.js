'use strict';

const service = require('../services/product.service');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const result = await service.list(req.user.company_id, { limit, offset });
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
    const data = await service.create(req.body, req.user.company_id);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await service.update(req.params.id, req.body, req.user.company_id);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const adjustStock = async (req, res, next) => {
  try {
    const { quantity, movement_type, notes } = req.body;
    const data = await service.adjust(
      req.params.id, quantity, movement_type, notes,
      req.user.company_id, req.user.id
    );
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const activate = async (req, res, next) => {
  try {
    const data = await service.setStatus(req.params.id, 'ACTIVE', req.user.company_id);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const deactivate = async (req, res, next) => {
  try {
    const data = await service.setStatus(req.params.id, 'INACTIVE', req.user.company_id);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id, req.user.company_id);
    res.status(204).send();
  } catch (err) { next(err); }
};

const bulkCreate = async (req, res, next) => {
  try {
    const result = await service.bulkCreate(req.body.products, req.user.company_id);
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

module.exports = { list, getById, create, update, adjustStock, activate, deactivate, remove, bulkCreate };
