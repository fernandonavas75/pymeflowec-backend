'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  id: {
    type:          DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey:    true,
  },
  company_id:     { type: DataTypes.BIGINT, allowNull: false },
  customer_id:    { type: DataTypes.BIGINT, allowNull: true  }, // NULL = Consumidor Final eliminado
  created_by:     { type: DataTypes.BIGINT, allowNull: false },
  invoice_number: {
    type:      DataTypes.STRING(20),
    allowNull: false,
    validate: { notEmpty: true },
  },
  issue_date: {
    type:         DataTypes.DATE,
    allowNull:    false,
    defaultValue: DataTypes.NOW,
  },
  subtotal:   { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, validate: { min: 0 } },
  tax_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, validate: { min: 0 } },
  total:      { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, validate: { min: 0 } },
  status: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'ISSUED',
    validate: { isIn: [['ISSUED', 'CANCELLED']] },
  },
  payment_status: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'PENDIENTE',
    validate: { isIn: [['PENDIENTE', 'PARCIAL', 'COBRADO', 'ANULADO']] },
  },
}, {
  tableName:  'invoices',
  schema:     'erp',
  timestamps: true,
  paranoid:   true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
  deletedAt:  'deleted_at',
});

module.exports = Invoice;
