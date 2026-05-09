'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InvoiceDetail = sequelize.define('InvoiceDetail', {
  id: {
    type:          DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey:    true,
  },
  invoice_id:     { type: DataTypes.BIGINT,        allowNull: false },
  company_id:     { type: DataTypes.BIGINT,        allowNull: false },
  product_id:     { type: DataTypes.BIGINT,        allowNull: true  },
  tax_rate_id:    { type: DataTypes.BIGINT,        allowNull: true  },
  product_name: {
    type:      DataTypes.STRING(150),
    allowNull: false,
    validate: { notEmpty: true },
  },
  description:    { type: DataTypes.TEXT,          allowNull: true  },
  quantity: {
    type:      DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 },
  },
  unit_price:     { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 0 } },
  discount:       { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, validate: { min: 0 } },
  tax_percentage: { type: DataTypes.DECIMAL(5, 2),  allowNull: false, defaultValue: 0, validate: { min: 0, max: 100 } },
  tax_amount:     { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, validate: { min: 0 } },
  line_subtotal:  { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, validate: { min: 0 } },
  line_total:     { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, validate: { min: 0 } },
}, {
  tableName:  'invoice_details',
  schema:     'erp',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
});

module.exports = InvoiceDetail;
