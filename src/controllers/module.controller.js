'use strict';

const svc = require('../services/module.service');

const listAll = async (req, res, next) => {
  try {
    const modules = await svc.listAll();
    res.json({ success: true, data: modules });
  } catch (err) { next(err); }
};

const listActive = async (req, res, next) => {
  try {
    const modules = await svc.listActive(req.user.company_id);
    res.json({ success: true, data: modules });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const mod = await svc.getById(Number(req.params.id));
    res.json({ success: true, data: mod });
  } catch (err) { next(err); }
};

const listPublic = async (req, res, next) => {
  try {
    const modules = await svc.listPublic();
    res.json({ success: true, data: modules });
  } catch (err) { next(err); }
};

const getCompanyCatalog = async (req, res, next) => {
  try {
    const data = await svc.getCompanyCatalog(req.user.company_id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { listAll, listActive, getById, listPublic, getCompanyCatalog };
