'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrganizationModule = sequelize.define('OrganizationModule', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: { type: DataTypes.INTEGER, allowNull: false },
  module_id:       { type: DataTypes.INTEGER, allowNull: false },
  activated_at: {
    type:         DataTypes.DATE,
    allowNull:    false,
    defaultValue: DataTypes.NOW,
  },
  activated_by:   { type: DataTypes.INTEGER, allowNull: true },
  deactivated_at: { type: DataTypes.DATE,    allowNull: true },
  deactivated_by: { type: DataTypes.INTEGER, allowNull: true },
  is_active: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true,
  },
  request_id: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName:  'organization_modules',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

module.exports = OrganizationModule;
