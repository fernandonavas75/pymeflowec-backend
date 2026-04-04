'use strict';

const svc = require('../services/platformModule.service');

const listAll = async (req, res, next) => {
  try {
    const modules = await svc.listAll();
    res.json({ success: true, data: modules });
  } catch (err) { next(err); }
};

const listActive = async (req, res, next) => {
  try {
    const orgId   = req.user.organization_id;
    const modules = await svc.listActive(orgId);
    res.json({ success: true, data: modules });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const mod = await svc.getById(Number(req.params.id));
    res.json({ success: true, data: mod });
  } catch (err) { next(err); }
};

module.exports = { listAll, listActive, getById };
