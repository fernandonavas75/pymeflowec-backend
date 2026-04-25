'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CompanyModuleRequest = sequelize.define('CompanyModuleRequest', {
  id: {
    type:          DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey:    true,
  },
  company_id:   { type: DataTypes.BIGINT, allowNull: false },
  module_id:    { type: DataTypes.BIGINT, allowNull: false },
  requested_by: { type: DataTypes.BIGINT, allowNull: false },
  status: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'PENDING',
    validate: { isIn: [['PENDING', 'APPROVED', 'REJECTED', 'REVOKED']] },
  },
  reviewed_by: { type: DataTypes.BIGINT, allowNull: true },
  reviewed_at: { type: DataTypes.DATE,   allowNull: true },
  comments:    { type: DataTypes.TEXT,   allowNull: true },
  expires_at:  { type: DataTypes.DATE,   allowNull: true },
}, {
  tableName:  'company_module_requests',
  schema:     'erp',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

module.exports = CompanyModuleRequest;
