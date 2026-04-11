'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Registro unificado de auditoría (plataforma + tienda).
// Poblado automáticamente por triggers en la BD.
const AuditLog = sequelize.define('AuditLog', {
  id: {
    type:          DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey:    true,
  },
  company_id:  { type: DataTypes.BIGINT,      allowNull: true },
  user_id:     { type: DataTypes.BIGINT,      allowNull: true },
  action:      { type: DataTypes.STRING(50),  allowNull: false },
  table_name:  { type: DataTypes.STRING(100), allowNull: false },
  record_id:   { type: DataTypes.BIGINT,      allowNull: true },
  old_values:  { type: DataTypes.JSONB,       allowNull: true },
  new_values:  { type: DataTypes.JSONB,       allowNull: true },
  ip_address:  { type: DataTypes.STRING(45),  allowNull: true },
  user_agent:  { type: DataTypes.TEXT,        allowNull: true },
}, {
  tableName:  'audit_logs',
  schema:     'erp',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
});

module.exports = AuditLog;
