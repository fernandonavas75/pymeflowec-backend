'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  order_id: {
    type:      DataTypes.INTEGER,
    allowNull: true,
  },
  invoice_number: {
    type:      DataTypes.STRING(50),
    allowNull: false,
    unique:    true,
    validate: {
      notEmpty: true,
    },
  },
  issue_date: {
    type:         DataTypes.DATEONLY,
    allowNull:    false,
    defaultValue: DataTypes.NOW,
  },
  subtotal: {
    type:         DataTypes.DECIMAL(14, 2),
    allowNull:    false,
    defaultValue: 0,
  },
  tax: {
    type:         DataTypes.DECIMAL(14, 2),
    allowNull:    false,
    defaultValue: 0,
  },
  total: {
    type:         DataTypes.DECIMAL(14, 2),
    allowNull:    false,
    defaultValue: 0,
  },
  status: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'issued',
    validate: {
      isIn: [['issued', 'paid', 'cancelled', 'overdue']],
    },
  },
}, {
  tableName:  'invoices',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

module.exports = Invoice;