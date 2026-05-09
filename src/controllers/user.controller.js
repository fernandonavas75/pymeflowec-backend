'use strict';

const service = require('../services/user.service');
const { parsePagination, paginatedResponse } = require('../utils/pagination');
const userService = require('../services/user.service');

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
    const targetId     = parseInt(req.params.id, 10);
    const isOwnAccount = req.user.id === targetId;
    const isAdmin      = req.user.role.name === 'STORE_ADMIN';

    if (!isOwnAccount && !isAdmin) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para cambiar la contraseña de otro usuario.' });
    }

    const { current_password, new_password } = req.body;
    // Admin cambiando cuenta ajena: omite verificación de contraseña actual
    const skipCurrentCheck = isAdmin && !isOwnAccount;
    await service.changePassword(targetId, current_password, new_password, req.user.company_id, skipCurrentCheck);
    res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (err) { next(err); }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await service.forgotPassword(email);
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, new_password } = req.body;
    await service.resetPassword(token, new_password);
    res.status(200).json({ success: true, message: 'Contraseña restablecida correctamente.' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id, req.user.company_id);
    res.status(204).send();
  } catch (err) { next(err); }
};

module.exports = { list, getById, create, update, activate, deactivate, lock, changePassword, remove, forgotPassword, resetPassword };
