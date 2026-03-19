'use strict';

const service = require('../services/product.service');

const list = async (req, res, next) => {
  try {
    const data = await service.list(req.user.organization_id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await service.getById(req.params.id, req.user.organization_id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await service.create(req.body, req.user.organization_id);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await service.update(req.params.id, req.body, req.user.organization_id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateStock = async (req, res, next) => {
  try {
    const { stock } = req.body;
    if (stock === undefined || stock === null) {
      return res.status(400).json({ success: false, message: 'El campo stock es requerido.' });
    }
    const data = await service.updateStock(req.params.id, stock, req.user.organization_id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const activate = async (req, res, next) => {
  try {
    const data = await service.setStatus(req.params.id, 'active', req.user.organization_id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const deactivate = async (req, res, next) => {
  try {
    const data = await service.setStatus(req.params.id, 'inactive', req.user.organization_id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create, update, updateStock, activate, deactivate };