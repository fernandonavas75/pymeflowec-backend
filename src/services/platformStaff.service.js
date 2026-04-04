'use strict';

const {
  PlatformStaff, PlatformRole, User, PlatformAuditLog,
} = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const list = async () => {
  return PlatformStaff.findAll({
    include: [
      { model: PlatformRole, as: 'platformRole' },
      { model: User, as: 'user', attributes: ['id', 'full_name', 'email', 'status'] },
    ],
    order: [['created_at', 'DESC']],
  });
};

const assign = async ({ userId, platformRoleId, assignedBy, notes }) => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('Usuario no encontrado.', 404);

  const role = await PlatformRole.findByPk(platformRoleId);
  if (!role) throw new AppError('Rol de plataforma no encontrado.', 404);

  const [staff, created] = await PlatformStaff.findOrCreate({
    where: { user_id: userId },
    defaults: { platform_role_id: platformRoleId, assigned_by: assignedBy, notes, is_active: true },
  });

  if (!created) {
    await staff.update({ platform_role_id: platformRoleId, assigned_by: assignedBy, notes, is_active: true });
  }

  await PlatformAuditLog.create({
    staff_id:    null,
    user_id:     assignedBy,
    action:      'STAFF_ASSIGN',
    description: `Staff asignado: user_id=${userId}, role=${role.code}`,
    entity_type: 'platform_staff',
    entity_id:   staff.id,
  });

  return staff.reload({
    include: [
      { model: PlatformRole, as: 'platformRole' },
      { model: User, as: 'user', attributes: ['id', 'full_name', 'email'] },
    ],
  });
};

const revoke = async (staffId, revokedBy) => {
  const staff = await PlatformStaff.findByPk(staffId);
  if (!staff) throw new AppError('Registro de staff no encontrado.', 404);

  await staff.update({ is_active: false });

  await PlatformAuditLog.create({
    staff_id:    staffId,
    user_id:     revokedBy,
    action:      'STAFF_REVOKE',
    description: `Acceso de plataforma revocado para staff_id=${staffId}`,
    entity_type: 'platform_staff',
    entity_id:   staffId,
  });

  return staff;
};

const listRoles = async () => PlatformRole.findAll({ order: [['id', 'ASC']] });

module.exports = { list, assign, revoke, listRoles };
