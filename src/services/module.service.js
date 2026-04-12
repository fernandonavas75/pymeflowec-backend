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
  // Para cada módulo sólo nos interesa la solicitud más reciente
  const requestMap = new Map();
  for (const r of requests) {
    if (!requestMap.has(Number(r.module_id))) requestMap.set(Number(r.module_id), r);
  }

  return modules.map(mod => {
    const id = Number(mod.id);
    const cm  = activeMap.get(id);
    const req = requestMap.get(id);

    let status     = null;
    let request_id = null;

    if (cm && cm.is_active) {
      status = 'APPROVED';
    } else if (req) {
      status     = req.status;   // PENDING | APPROVED | REJECTED
      request_id = req.id;
    }

    return { ...mod.toJSON(), status, request_id };
  });
};

module.exports = { listAll, listActive, getById, listPublic, getCompanyCatalog };
