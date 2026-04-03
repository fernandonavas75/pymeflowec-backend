'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: { type: DataTypes.INTEGER, allowNull: true },
  role_id:         { type: DataTypes.INTEGER, allowNull: false },
  full_name: {
    type:      DataTypes.STRING(255),
    allowNull: false,
    validate: { notEmpty: true, len: [2, 255] },
  },
  email: {
    type:      DataTypes.STRING(255),
    allowNull: false,
    unique:    true,
    validate: { isEmail: true, notEmpty: true },
  },
  password_hash:       { type: DataTypes.TEXT,        allowNull: false },
  reset_token:         { type: DataTypes.STRING(255), allowNull: true },
  reset_token_expires: { type: DataTypes.DATE,        allowNull: true },
  status: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'active',
    validate: { isIn: [['active', 'inactive', 'suspended']] },
  },
}, {
  tableName:  'users',
  timestamps: true,
  paranoid:   true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
  deletedAt:  'deleted_at',
  hooks: {
    beforeCreate: (user) => {
      if (user.email)     user.email     = user.email.toLowerCase().trim();
      if (user.full_name) user.full_name = user.full_name.trim();
    },
    beforeUpdate: (user) => {
      if (user.changed('email'))     user.email     = user.email.toLowerCase().trim();
      if (user.changed('full_name')) user.full_name = user.full_name.trim();
    },
  },
});

module.exports = User;
