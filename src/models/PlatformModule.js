'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlatformModule = sequelize.define('PlatformModule', {
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
    type:      DataTypes.STRING(150),
    allowNull: false,
    validate: { notEmpty: true },
  },
  description: { type: DataTypes.TEXT,        allowNull: true },
  icon:        { type: DataTypes.STRING(50),  allowNull: true },
  is_default: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: false,
  },
  is_active: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true,
  },
  sort_order: {
    type:         DataTypes.INTEGER,
    allowNull:    false,
    defaultValue: 0,
  },
  dependencies: {
    type:      DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: true,
  },
}, {
  tableName:  'platform_modules',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

module.exports = PlatformModule;
