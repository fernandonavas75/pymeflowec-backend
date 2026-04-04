'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlatformRole = sequelize.define('PlatformRole', {
  id: {
    type:          DataTypes.INTEGER,
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
  description: { type: DataTypes.TEXT,    allowNull: true },
  can_write: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: false,
  },
  can_read: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true,
  },
}, {
  tableName:  'platform_roles',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
});

module.exports = PlatformRole;
