'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlatformStaff = sequelize.define('PlatformStaff', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  user_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
    unique:    true,
  },
  platform_role_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  is_active: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true,
  },
  assigned_by: { type: DataTypes.INTEGER, allowNull: true },
  notes:       { type: DataTypes.TEXT,    allowNull: true },
}, {
  tableName:  'platform_staff',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

module.exports = PlatformStaff;
