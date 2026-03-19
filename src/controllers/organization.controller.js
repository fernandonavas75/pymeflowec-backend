'use strict';

const service = require('../services/organization.service');

const list = async (req, res, next) => {
  try {
    const data = await service.list();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await service.getById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await service.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await service.update(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const activate = async (req, res, next) => {
  try {
    const data = await service.setStatus(req.params.id, 'active');
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const deactivate = async (req, res, next) => {
  try {
    const data = await service.setStatus(req.params.id, 'inactive');
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create, update, activate, deactivate };