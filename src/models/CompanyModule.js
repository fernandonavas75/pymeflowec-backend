'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CompanyModule = sequelize.define('CompanyModule', {
  id: {
    type:          DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey:    true,
  },
  company_id:  { type: DataTypes.BIGINT, allowNull: false },
  module_id:   { type: DataTypes.BIGINT, allowNull: false },
  is_active: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true,
  },
  approved_by: { type: DataTypes.BIGINT, allowNull: true },
  approved_at: { type: DataTypes.DATE,   allowNull: true },
}, {
  tableName:  'company_modules',
  schema:     'erp',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

module.exports = CompanyModule;
