'use strict';

const service = require('../services/invoice.service');

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

const createFromOrder = async (req, res, next) => {
  try {
    const { order_id } = req.body;
    if (!order_id) {
      return res.status(400).json({ success: false, message: 'order_id es requerido.' });
    }
    const data = await service.createFromOrder(order_id, req.user.organization_id);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createManual = async (req, res, next) => {
  try {
    const data = await service.createManual(req.body, req.user.organization_id);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const markPaid = async (req, res, next) => {
  try {
    const data = await service.setStatus(req.params.id, 'paid', req.user.organization_id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const markOverdue = async (req, res, next) => {
  try {
    const data = await service.setStatus(req.params.id, 'overdue', req.user.organization_id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    const data = await service.setStatus(req.params.id, 'cancelled', req.user.organization_id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, createFromOrder, createManual, markPaid, markOverdue, cancel };