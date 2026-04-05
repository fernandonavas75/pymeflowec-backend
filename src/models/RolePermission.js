'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Tabla de unión Role ↔ Permission — sin timestamps propios.
const RolePermission = sequelize.define('RolePermission', {
  role_id: {
    type:       DataTypes.INTEGER,
    primaryKey: true,
  },
  permission_id: {
    type:       DataTypes.INTEGER,
    primaryKey: true,
  },
}, {
  tableName:  'role_permissions',
  timestamps: false,
});

module.exports = RolePermission;
