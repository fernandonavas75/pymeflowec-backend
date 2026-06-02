'use strict';

const { Module, CompanyModule, CompanyModuleRequest } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

// Lista todos los módulos del catálogo (admin de plataforma)
const listAll = async () => {
  return Module.findAll({ order: [['code', 'ASC']] });
};

// Lista módulos activos de una empresa
const listActive = async (companyId) => {
  return CompanyModule.findAll({
    where:   { company_id: companyId, is_active: true },
    include: [{ model: Module, as: 'module' }],
    order:   [[{ model: Module, as: 'module' }, 'code', 'ASC']],
  });
};

const getById = async (id) => {
  const mod = await Module.findByPk(id);
  if (!mod) throw new AppError('Módulo no encontrado.', 404);
  return mod;
};

// Lista módulos activos visibles al público (para onboarding)
const listPublic = async () => {
  return Module.findAll({
    where:      { is_active: true },
    attributes: ['id', 'code', 'name', 'description'],
    order:      [['code', 'ASC']],
  });
};

/**
 * Retorna todos los módulos activos de la plataforma junto con el estado
 * de acceso de la empresa: APPROVED | PENDING | REJECTED | null
 */
const getCompanyCatalog = async (companyId) => {
  const [modules, companyModules, requests] = await Promise.all([
    Module.findAll({ where: { is_active: true }, order: [['name', 'ASC']] }),
    CompanyModule.findAll({ where: { company_id: companyId } }),
    CompanyModuleRequest.findAll({
      where: { company_id: companyId },
      order: [['created_at', 'DESC']],
    }),
  ]);

  const activeMap  = new Map(companyModules.map(cm => [Number(cm.module_id), cm]));
  // Solicitud más reciente por módulo (cualquier status — para mostrar estado)
  const requestMap = new Map();
  // Solicitud APPROVED más reciente por módulo (para revocar módulos activos)
  const approvedRequestMap = new Map();
  for (const r of requests) {
    const mid = Number(r.module_id);
    if (!requestMap.has(mid)) requestMap.set(mid, r);
    if (r.status === 'APPROVED' && !approvedRequestMap.has(mid)) approvedRequestMap.set(mid, r);
  }

  const now = new Date();

  return modules.map(mod => {
    const id = Number(mod.id);
    const cm  = activeMap.get(id);
    const req = requestMap.get(id);

    let status     = null;
    let request_id = null;
    let expires_at = null;
    let is_trial   = false;

    const isExpired = cm && cm.expires_at != null && new Date(cm.expires_at) <= now;
    const isActive  = cm && cm.is_active && !isExpired;

    if (isActive) {
      status     = 'APPROVED';
      expires_at = cm.expires_at ?? null;
      request_id = approvedRequestMap.get(id)?.id ?? null;
      is_trial   = cm.approved_by == null && cm.expires_at != null;
    } else if (isExpired) {
      if (req?.status === 'PENDING') {
        status     = 'PENDING';
        request_id = req.id;
        expires_at = null;
      } else {
        status     = 'EXPIRED';
        expires_at = cm.expires_at;
        request_id = approvedRequestMap.get(id)?.id ?? null;
        is_trial   = cm.approved_by == null;
      }
    } else if (req) {
      status     = req.status;   // PENDING | REJECTED | REVOKED
      request_id = req.id;
      expires_at = req.expires_at ?? null;
    }

    return { ...mod.toJSON(), status, request_id, expires_at, is_trial };
  });
};

module.exports = { listAll, listActive, getById, listPublic, getCompanyCatalog };
