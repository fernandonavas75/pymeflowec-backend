'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Role = sequelize.define('Role', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  name: {
    type:      DataTypes.STRING(100),
    allowNull: false,
    unique:    true,
    validate: {
      notEmpty: true,
      isIn: [['superadmin', 'admin', 'manager', 'seller', 'viewer']],
    },
  },
  description: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName:  'roles',
  timestamps: false,
});

module.exports = Role;