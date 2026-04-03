'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Permission = sequelize.define('Permission', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  code: {
    type:      DataTypes.STRING(100),
    allowNull: false,
    unique:    true,
    validate: { notEmpty: true },
  },
  module: {
    type:      DataTypes.STRING(50),
    allowNull: false,
    validate: { notEmpty: true },
  },
  description: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName:  'permissions',
  timestamps: false,
});

module.exports = Permission;
