'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// FINAL_CONSUMER → document_number = '9999999999999' (exactamente 13 dígitos)
// CEDULA         → 10 dígitos
// RUC            → 13 dígitos
const StoreCustomer = sequelize.define('StoreCustomer', {
  id: {
    type:          DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey:    true,
  },
  company_id: { type: DataTypes.BIGINT, allowNull: false },
  customer_type: {
    type:      DataTypes.STRING(20),
    allowNull: false,
    validate: { isIn: [['CEDULA', 'RUC', 'FINAL_CONSUMER']] },
  },
  document_number: {
    type:      DataTypes.STRING(13),
    allowNull: false,
    validate: { notEmpty: true },
  },
  full_name: {
    type:      DataTypes.STRING(150),
    allowNull: false,
    validate: { notEmpty: true, len: [2, 150] },
  },
  email:   { type: DataTypes.STRING(150), allowNull: true, validate: { isEmail: true } },
  phone:   { type: DataTypes.STRING(20),  allowNull: true },
  address: { type: DataTypes.STRING(255), allowNull: true },
}, {
  tableName:  'store_customers',
  schema:     'erp',
  timestamps: true,
  paranoid:   true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
  deletedAt:  'deleted_at',
  hooks: {
    beforeCreate: (c) => {
      if (c.full_name)       c.full_name       = c.full_name.trim();
      if (c.document_number) c.document_number = c.document_number.trim();
      if (c.email)           c.email           = c.email.toLowerCase().trim();
    },
    beforeUpdate: (c) => {
      if (c.changed('full_name'))       c.full_name       = c.full_name.trim();
      if (c.changed('document_number')) c.document_number = c.document_number.trim();
      if (c.changed('email'))           c.email           = c.email.toLowerCase().trim();
    },
  },
});

module.exports = StoreCustomer;
