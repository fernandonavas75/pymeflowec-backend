'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type:          DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey:    true,
  },
  name: {
    type:      DataTypes.STRING(150),
    allowNull: false,
    validate: { notEmpty: true, len: [2, 150] },
  },
  business_name: { type: DataTypes.STRING(200), allowNull: true },
  ruc: {
    type:      DataTypes.STRING(13),
    allowNull: true,
    unique:    true,
    validate: { len: [13, 13] },
  },
  email:   { type: DataTypes.STRING(150), allowNull: true, validate: { isEmail: true } },
  phone:   { type: DataTypes.STRING(20),  allowNull: true },
  address: { type: DataTypes.STRING(255), allowNull: true },
  invoice_settings: {
    type:         DataTypes.JSONB,
    allowNull:    false,
    defaultValue: {},
  },
  status: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'ACTIVE',
    validate: { isIn: [['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']] },
  },
}, {
  tableName:  'companies',
  schema:     'erp',
  timestamps: true,
  paranoid:   true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
  deletedAt:  'deleted_at',
  hooks: {
    beforeCreate: (c) => {
      if (c.name) c.name = c.name.trim();
      if (c.ruc)  c.ruc  = c.ruc.trim();
    },
    beforeUpdate: (c) => {
      if (c.changed('name')) c.name = c.name.trim();
      if (c.changed('ruc'))  c.ruc  = c.ruc.trim();
    },
  },
});

module.exports = Company;
