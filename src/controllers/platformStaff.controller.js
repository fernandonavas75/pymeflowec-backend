'use strict';

const svc = require('../services/platformStaff.service');

const list = async (req, res, next) => {
  try {
    const staff = await svc.list();
    res.json({ success: true, data: staff });
  } catch (err) { next(err); }
};

const listRoles = async (req, res, next) => {
  try {
    const roles = await svc.listRoles();
    res.json({ success: true, data: roles });
  } catch (err) { next(err); }
};

const assign = async (req, res, next) => {
  try {
    const { user_id, platform_role_id, notes } = req.body;
    const assignedBy = req.user.id;
    const staff      = await svc.assign({ userId: user_id, platformRoleId: platform_role_id, assignedBy, notes });
    res.status(201).json({ success: true, data: staff });
  } catch (err) { next(err); }
};

const revoke = async (req, res, next) => {
  try {
    await svc.revoke(Number(req.params.id), req.user.id);
    res.json({ success: true, message: 'Acceso de plataforma revocado.' });
  } catch (err) { next(err); }
};

module.exports = { list, listRoles, assign, revoke };
