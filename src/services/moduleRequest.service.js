'use strict';

const { sequelize }  = require('../config/database');
const {
  ModuleRequest, PlatformModule, Organization, User,
  OrganizationModule, PlatformAuditLog, PlatformStaff, PlatformRole,
} = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const list = async ({ organizationId, status, limit, offset }) => {
  const where = { organization_id: organizationId };
  if (status) where.status = status;

  return ModuleRequest.findAndCountAll({
    where,
    include: [
      { model: PlatformModule, as: 'module' },
      { model: User, as: 'requester', attributes: ['id', 'full_name', 'email'] },
      { model: User, as: 'reviewer',  attributes: ['id', 'full_name', 'email'] },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
};

// Platform admin: list all orgs' requests
const listAll = async ({ status, limit, offset }) => {
  const where = {};
  if (status) where.status = status;

  return ModuleRequest.findAndCountAll({
    where,
    include: [
      { model: PlatformModule,  as: 'module' },
      { model: Organization,    as: 'organization', attributes: ['id', 'name', 'ruc'] },
      { model: User, as: 'requester', attributes: ['id', 'full_name', 'email'] },
      { model: User, as: 'reviewer',  attributes: ['id', 'full_name', 'email'] },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const create = async ({ organizationId, moduleId, requestedBy, notes }) => {
  const mod = await PlatformModule.findByPk(moduleId);
  if (!mod || !mod.is_active) throw new AppError('Módulo no disponible.', 400);

  const existing = await ModuleRequest.findOne({
    where: { organization_id: organizationId, module_id: moduleId, status: 'pending' },
  });
  if (existing) throw new AppError('Ya existe una solicitud pendiente para este módulo.', 409);

  return ModuleRequest.create({
    organization_id: organizationId,
    module_id:       moduleId,
    requested_by:    requestedBy,
    notes,
  });
};

const approve = async (requestId, reviewerId) => {
  const staff = await PlatformStaff.findOne({
    where: { user_id: reviewerId, is_active: true },
    include: [{ model: PlatformRole, as: 'platformRole' }],
  });
  if (!staff?.platformRole?.can_write) {
    throw new AppError('Sin permisos para aprobar solicitudes.', 403);
  }

  const result = await sequelize.query(
    'SELECT approve_module_request(:requestId, :reviewerId)',
    { replacements: { requestId, reviewerId } }
  );

  return result;
};

const reject = async (requestId, reviewerId, reason) => {
  const staff = await PlatformStaff.findOne({
    where: { user_id: reviewerId, is_active: true },
    include: [{ model: PlatformRole, as: 'platformRole' }],
  });
  if (!staff?.platformRole?.can_write) {
    throw new AppError('Sin permisos para rechazar solicitudes.', 403);
  }

  await sequelize.query(
    'SELECT reject_module_request(:requestId, :reviewerId, :reason)',
    { replacements: { requestId, reviewerId, reason: reason ?? null } }
  );
};

const cancel = async (requestId, organizationId) => {
  const req = await ModuleRequest.findOne({
    where: { id: requestId, organization_id: organizationId, status: 'pending' },
  });
  if (!req) throw new AppError('Solicitud no encontrada o no está pendiente.', 404);
  await req.update({ status: 'cancelled' });
  return req;
};

module.exports = { list, listAll, create, approve, reject, cancel };
