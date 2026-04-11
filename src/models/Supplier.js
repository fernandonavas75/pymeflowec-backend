'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Supplier = sequelize.define('Supplier', {
  id: {
    type:          DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey:    true,
  },
  company_id: { type: DataTypes.BIGINT, allowNull: false },
  name: {
    type:      DataTypes.STRING(150),
    allowNull: false,
    validate: { notEmpty: true, len: [2, 150] },
  },
  ruc:     { type: DataTypes.STRING(13),  allowNull: true },
  phone:   { type: DataTypes.STRING(20),  allowNull: true },
  email:   { type: DataTypes.STRING(150), allowNull: true, validate: { isEmail: true } },
  address: { type: DataTypes.STRING(255), allowNull: true },
}, {
  tableName:  'suppliers',
  schema:     'erp',
  timestamps: true,
  paranoid:   true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
  deletedAt:  'deleted_at',
  hooks: {
    beforeCreate: (s) => {
      if (s.name)  s.name  = s.name.trim();
      if (s.email) s.email = s.email.toLowerCase().trim();
    },
    beforeUpdate: (s) => {
      if (s.changed('name'))  s.name  = s.name.trim();
      if (s.changed('email')) s.email = s.email.toLowerCase().trim();
    },
  },
});

module.exports = Supplier;
