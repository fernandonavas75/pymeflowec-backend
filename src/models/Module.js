'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Module = sequelize.define('Module', {
  id: {
    type:          DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey:    true,
  },
  code: {
    type:      DataTypes.STRING(50),
    allowNull: false,
    unique:    true,
    validate: { notEmpty: true },
  },
  name: {
    type:      DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true },
  },
  description: { type: DataTypes.STRING(255), allowNull: true },
  is_active: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true,
  },
}, {
  tableName:  'modules',
  schema:     'erp',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

module.exports = Module;
