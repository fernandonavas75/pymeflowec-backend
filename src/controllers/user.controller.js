'use strict';

const service = require('../services/user.service');
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

const lock = async (req, res, next) => {
  try {
    const data = await service.setStatus(req.params.id, 'LOCKED', req.user.company_id);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    await service.changePassword(req.params.id, current_password, new_password, req.user.company_id);
    res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id, req.user.company_id);
    res.status(204).send();
  } catch (err) { next(err); }
};

module.exports = { list, getById, create, update, activate, deactivate, lock, changePassword, remove };
