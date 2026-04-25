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

const approve = async (requestId, reviewerId, expiresAt) => {
  return sequelize.transaction(async (t) => {
    const req = await CompanyModuleRequest.findByPk(requestId, { transaction: t });
    if (!req || req.status !== 'PENDING') {
      throw new AppError('Solicitud no encontrada o no está pendiente.', 404);
    }

    const expiresDate = expiresAt ? new Date(expiresAt) : null;

    await req.update(
      { status: 'APPROVED', reviewed_by: reviewerId, reviewed_at: new Date(), expires_at: expiresDate },
      { transaction: t }
    );

    // Activar módulo en company_modules (upsert)
    const [cm] = await CompanyModule.findOrCreate({
      where:    { company_id: req.company_id, module_id: req.module_id },
      defaults: { is_active: true, approved_by: reviewerId, approved_at: new Date(), expires_at: expiresDate },
      transaction: t,
    });
    if (!cm.is_active || cm.expires_at?.getTime() !== expiresDate?.getTime()) {
      await cm.update({ is_active: true, approved_by: reviewerId, approved_at: new Date(), expires_at: expiresDate }, { transaction: t });
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

// Revoca un módulo ya aprobado: desactiva el acceso y marca la solicitud como REVOKED
const revoke = async (requestId, reviewerId) => {
  return sequelize.transaction(async (t) => {
    const req = await CompanyModuleRequest.findByPk(requestId, { transaction: t });
    if (!req || req.status !== 'APPROVED') {
      throw new AppError('Solicitud no encontrada o el módulo no está aprobado.', 404);
    }

    await req.update(
      { status: 'REVOKED', reviewed_by: reviewerId, reviewed_at: new Date() },
      { transaction: t }
    );

    await CompanyModule.update(
      { is_active: false },
      { where: { company_id: req.company_id, module_id: req.module_id }, transaction: t }
    );

    return req;
  });
};

// Revoca directamente por company_id + module_id (módulos sin solicitud formal)
const revokeByModule = async (companyId, moduleId, reviewerId) => {
  return sequelize.transaction(async (t) => {
    const cm = await CompanyModule.findOne({
      where: { company_id: companyId, module_id: moduleId },
      transaction: t,
    });
    if (!cm || !cm.is_active) {
      throw new AppError('El módulo no está activo para esta empresa.', 404);
    }

    await cm.update({ is_active: false }, { transaction: t });

    // Marcar la solicitud más reciente como REVOKED si existe
    const req = await CompanyModuleRequest.findOne({
      where: { company_id: companyId, module_id: moduleId, status: 'APPROVED' },
      order: [['created_at', 'DESC']],
      transaction: t,
    });
    if (req) {
      await req.update({ status: 'REVOKED', reviewed_by: reviewerId, reviewed_at: new Date() }, { transaction: t });
    }

    return cm;
  });
};

module.exports = { list, listAll, create, approve, reject, revoke, revokeByModule };
