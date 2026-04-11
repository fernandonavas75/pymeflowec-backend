'use strict';

const { sequelize }  = require('../config/database');
const {
  CompanyModuleRequest, CompanyModule, Module, Company, User,
} = require('../models');
const { AppError } = require('../middlewares/errorHandler');

// Lista solicitudes de una empresa
const list = async ({ companyId, status, limit, offset }) => {
  const where = { company_id: companyId };
  if (status) where.status = status;

  return CompanyModuleRequest.findAndCountAll({
    where,
    include: [
      { model: Module, as: 'module' },
      { model: User, as: 'requester', attributes: ['id', 'full_name', 'email'] },
      { model: User, as: 'reviewer',  attributes: ['id', 'full_name', 'email'] },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
};

// Admin de plataforma: lista todas las solicitudes
const listAll = async ({ status, limit, offset }) => {
  const where = {};
  if (status) where.status = status;

  return CompanyModuleRequest.findAndCountAll({
    where,
    include: [
      { model: Module,  as: 'module' },
      { model: Company, as: 'company', attributes: ['id', 'name', 'ruc'] },
      { model: User, as: 'requester', attributes: ['id', 'full_name', 'email'] },
      { model: User, as: 'reviewer',  attributes: ['id', 'full_name', 'email'] },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const create = async ({ companyId, moduleId, requestedBy, comments }) => {
  const mod = await Module.findByPk(moduleId);
  if (!mod || !mod.is_active) throw new AppError('Módulo no disponible.', 400);

  const existing = await CompanyModuleRequest.findOne({
    where: { company_id: companyId, module_id: moduleId, status: 'PENDING' },
  });
  if (existing) throw new AppError('Ya existe una solicitud pendiente para este módulo.', 409);

  return CompanyModuleRequest.create({
    company_id:   companyId,
    module_id:    moduleId,
    requested_by: requestedBy,
    comments,
  });
};

const approve = async (requestId, reviewerId) => {
  return sequelize.transaction(async (t) => {
    const req = await CompanyModuleRequest.findByPk(requestId, { transaction: t });
    if (!req || req.status !== 'PENDING') {
      throw new AppError('Solicitud no encontrada o no está pendiente.', 404);
    }

    await req.update(
      { status: 'APPROVED', reviewed_by: reviewerId, reviewed_at: new Date() },
      { transaction: t }
    );

    // Activar módulo en company_modules (upsert)
    const [cm] = await CompanyModule.findOrCreate({
      where:    { company_id: req.company_id, module_id: req.module_id },
      defaults: { is_active: true, approved_by: reviewerId, approved_at: new Date() },
      transaction: t,
    });
    if (!cm.is_active) {
      await cm.update({ is_active: true, approved_by: reviewerId, approved_at: new Date() }, { transaction: t });
    }

    return req;
  });
};

const reject = async (requestId, reviewerId, comments) => {
  const req = await CompanyModuleRequest.findByPk(requestId);
  if (!req || req.status !== 'PENDING') {
    throw new AppError('Solicitud no encontrada o no está pendiente.', 404);
  }
  await req.update({ status: 'REJECTED', reviewed_by: reviewerId, reviewed_at: new Date(), comments });
  return req;
};

module.exports = { list, listAll, create, approve, reject };
