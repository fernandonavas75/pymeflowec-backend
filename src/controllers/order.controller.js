'use strict';

const service = require('../services/order.service');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const result = await service.list(
      req.user.organization_id,
      req.user.id,
      req.user.role.name,
      { limit, offset }
    );
    res.status(200).json({ success: true, ...paginatedResponse(result, page, limit) });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await service.getById(
      req.params.id,
      req.user.organization_id,
      req.user.id,
      req.user.role.name
    );
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await service.create(
      req.body,
      req.user.organization_id,
      req.user.id
    );
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const confirm = async (req, res, next) => {
  try {
    const data = await service.updateStatus(
      req.params.id, 'confirmed',
      req.user.organization_id,
      req.user.id,
      req.user.role.name
    );
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const ship = async (req, res, next) => {
  try {
    const data = await service.updateStatus(
      req.params.id, 'shipped',
      req.user.organization_id,
      req.user.id,
      req.user.role.name
    );
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const deliver = async (req, res, next) => {
  try {
    const data = await service.updateStatus(
      req.params.id, 'delivered',
      req.user.organization_id,
      req.user.id,
      req.user.role.name
    );
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    const data = await service.updateStatus(
      req.params.id, 'cancelled',
      req.user.organization_id,
      req.user.id,
      req.user.role.name
    );
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create, confirm, ship, deliver, cancel };