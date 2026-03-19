'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: {
    type:      DataTypes.INTEGER,
    allowNull: true,
  },
  user_id: {
    type:      DataTypes.INTEGER,
    allowNull: true,
  },
  action: {
    type:      DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      isIn: [['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'RESET_REQUEST', 'RESET_PASSWORD']],
    },
  },
  module: {
    type:      DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  description: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName:  'audit_logs',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
});

module.exports = AuditLog;