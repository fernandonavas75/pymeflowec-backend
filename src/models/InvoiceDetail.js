'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InvoiceDetail = sequelize.define('InvoiceDetail', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: { type: DataTypes.INTEGER,     allowNull: false },
  invoice_id:      { type: DataTypes.INTEGER,     allowNull: false },
  product_id:      { type: DataTypes.INTEGER,     allowNull: false },
  quantity: {
    type:      DataTypes.DECIMAL(12, 3),
    allowNull: false,
    validate: { min: 0.001 },
  },
  unit_price: {
    type:      DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 0 },
  },
  cost_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  tax_rate:   { type: DataTypes.DECIMAL(5, 4),  allowNull: false, defaultValue: 0 },
  subtotal:   { type: DataTypes.DECIMAL(14, 2), allowNull: false },
}, {
  tableName:  'invoice_details',
  timestamps: false,
});

module.exports = InvoiceDetail;
