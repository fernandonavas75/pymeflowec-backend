'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ModuleRequest = sequelize.define('ModuleRequest', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: { type: DataTypes.INTEGER, allowNull: false },
  module_id:       { type: DataTypes.INTEGER, allowNull: false },
  requested_by:    { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'pending',
    validate: { isIn: [['pending', 'approved', 'rejected', 'cancelled']] },
  },
  reviewed_by:      { type: DataTypes.INTEGER, allowNull: true },
  reviewed_at:      { type: DataTypes.DATE,    allowNull: true },
  rejection_reason: { type: DataTypes.TEXT,    allowNull: true },
  notes:            { type: DataTypes.TEXT,    allowNull: true },
}, {
  tableName:  'module_requests',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

module.exports = ModuleRequest;
