'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SystemLog = sequelize.define('SystemLog', {
  id: {
    type:          DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey:    true,
  },
  company_id: { type: DataTypes.BIGINT, allowNull: true },
  user_id:    { type: DataTypes.BIGINT, allowNull: true },
  level: {
    type:      DataTypes.STRING(10),
    allowNull: false,
    validate: { isIn: [['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']] },
  },
  source: {
    type:      DataTypes.STRING(50),
    allowNull: false,
    validate: { isIn: [['BACKEND', 'DATABASE', 'AUTH', 'API', 'CRON']] },
  },
  message: { type: DataTypes.TEXT,  allowNull: false },
  details: { type: DataTypes.JSONB, allowNull: true  },
}, {
  tableName:  'system_logs',
  schema:     'erp',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
});

module.exports = SystemLog;
