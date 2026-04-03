'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PurchaseOrder = sequelize.define('PurchaseOrder', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: { type: DataTypes.INTEGER,    allowNull: false },
  supplier_id:     { type: DataTypes.INTEGER,    allowNull: false },
  user_id:         { type: DataTypes.INTEGER,    allowNull: false },
  po_number: {
    type:      DataTypes.STRING(50),
    allowNull: false,
    validate: { notEmpty: true },
  },
  order_date:    { type: DataTypes.DATEONLY,       allowNull: false, defaultValue: DataTypes.NOW },
  expected_date: { type: DataTypes.DATEONLY,       allowNull: true },
  received_date: { type: DataTypes.DATEONLY,       allowNull: true },
  subtotal:      { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  tax:           { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  total:         { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  status: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'draft',
    validate: { isIn: [['draft', 'sent', 'partial', 'received', 'cancelled']] },
  },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName:  'purchase_orders',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

module.exports = PurchaseOrder;
