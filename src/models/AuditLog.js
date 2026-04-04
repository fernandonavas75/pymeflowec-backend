'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AUDIT_ACTIONS = [
  'CREATE', 'UPDATE', 'DELETE',
  'LOGIN', 'LOGOUT',
  'RESET_REQUEST', 'RESET_PASSWORD',
  'ACTIVATE', 'DEACTIVATE', 'SUSPEND',
  'STATUS_CHANGE', 'EXPORT', 'BULK_UPDATE',
  'CASH_OPEN', 'CASH_CLOSE', 'PAYMENT',
  'SRI_SEND', 'SRI_AUTHORIZE', 'SRI_REJECT',
  'EXPENSE_CREATE', 'EXPENSE_CANCEL',
  'MODULE_REQUEST', 'MODULE_ACTIVATE', 'MODULE_DEACTIVATE',
];

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: { type: DataTypes.INTEGER, allowNull: true },
  user_id:         { type: DataTypes.INTEGER, allowNull: true },
  action: {
    type:      DataTypes.STRING(50),
    allowNull: false,
    validate: { notEmpty: true, isIn: [AUDIT_ACTIONS] },
  },
  module:      { type: DataTypes.STRING(100), allowNull: false, validate: { notEmpty: true } },
  description: { type: DataTypes.TEXT,        allowNull: true },
  ip_address:  { type: DataTypes.INET,        allowNull: true },
  user_agent:  { type: DataTypes.STRING(500), allowNull: true },
  entity_type: { type: DataTypes.STRING(100), allowNull: true },
  entity_id:   { type: DataTypes.INTEGER,     allowNull: true },
  old_values:  { type: DataTypes.JSONB,       allowNull: true },
  new_values:  { type: DataTypes.JSONB,       allowNull: true },
}, {
  tableName:  'audit_logs',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
});

module.exports = AuditLog;
