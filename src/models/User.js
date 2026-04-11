'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// company_id NULL  → usuario de plataforma (scope PLATFORM)
// company_id !NULL → usuario de tienda (scope STORE)
const User = sequelize.define('User', {
  id: {
    type:          DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey:    true,
  },
  company_id: { type: DataTypes.BIGINT, allowNull: true },
  role_id:    { type: DataTypes.BIGINT, allowNull: false },
  full_name: {
    type:      DataTypes.STRING(150),
    allowNull: false,
    validate: { notEmpty: true, len: [2, 150] },
  },
  email: {
    type:      DataTypes.STRING(150),
    allowNull: false,
    unique:    true,
    validate: { isEmail: true, notEmpty: true },
  },
  password_hash: { type: DataTypes.TEXT, allowNull: false },
  status: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'ACTIVE',
    validate: { isIn: [['ACTIVE', 'INACTIVE', 'LOCKED']] },
  },
}, {
  tableName:  'users',
  schema:     'erp',
  timestamps: true,
  paranoid:   true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
  deletedAt:  'deleted_at',
  hooks: {
    beforeCreate: (u) => {
      if (u.email)     u.email     = u.email.toLowerCase().trim();
      if (u.full_name) u.full_name = u.full_name.trim();
    },
    beforeUpdate: (u) => {
      if (u.changed('email'))     u.email     = u.email.toLowerCase().trim();
      if (u.changed('full_name')) u.full_name = u.full_name.trim();
    },
  },
});

module.exports = User;
