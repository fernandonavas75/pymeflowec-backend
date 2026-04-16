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
    // Un admin de plataforma puede consultar el catálogo de cualquier empresa
    // pasando company_id como query param. Usuarios de tienda siempre ven el suyo.
    const isPlatform = req.user?.role?.scope === 'PLATFORM';
    const companyId  = isPlatform && req.query.company_id
      ? Number(req.query.company_id)
      : req.user.company_id;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere company_id para consultar el catálogo de módulos.',
      });
    }

    const data = await svc.getCompanyCatalog(companyId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { listAll, listActive, getById, listPublic, getCompanyCatalog };
