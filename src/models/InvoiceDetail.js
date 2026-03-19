'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InvoiceDetail = sequelize.define('InvoiceDetail', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  invoice_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  product_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  quantity: {
    type:      DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  unit_price: {
    type:      DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  subtotal: {
    type:      DataTypes.DECIMAL(14, 2),
    allowNull: false,
  },
}, {
  tableName:  'invoice_details',
  timestamps: false,
});

module.exports = InvoiceDetail;