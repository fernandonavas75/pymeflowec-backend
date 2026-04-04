'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PLATFORM_ACTIONS = [
  'MODULE_APPROVE', 'MODULE_REJECT', 'MODULE_DEACTIVATE',
  'ORG_ACTIVATE', 'ORG_DEACTIVATE', 'ORG_SUSPEND',
  'STAFF_ASSIGN', 'STAFF_REVOKE',
  'SUPPORT_VIEW_LOGS', 'SUPPORT_VIEW_DATA',
  'CONFIG_CHANGE', 'PLATFORM_LOGIN',
];

const PlatformAuditLog = sequelize.define('PlatformAuditLog', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  staff_id:      { type: DataTypes.INTEGER, allowNull: true },
  user_id:       { type: DataTypes.INTEGER, allowNull: true },
  action: {
    type:      DataTypes.STRING(50),
    allowNull: false,
    validate: { notEmpty: true, isIn: [PLATFORM_ACTIONS] },
  },
  target_org_id: { type: DataTypes.INTEGER,     allowNull: true },
  module:        { type: DataTypes.STRING(100),  allowNull: true },
  description:   { type: DataTypes.TEXT,         allowNull: true },
  ip_address:    { type: DataTypes.INET,         allowNull: true },
  user_agent:    { type: DataTypes.STRING(500),  allowNull: true },
  entity_type:   { type: DataTypes.STRING(100),  allowNull: true },
  entity_id:     { type: DataTypes.INTEGER,      allowNull: true },
  metadata:      { type: DataTypes.JSONB,        allowNull: true },
}, {
  tableName:  'platform_audit_logs',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
});

module.exports = PlatformAuditLog;
