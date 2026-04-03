'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PurchaseOrderDetail = sequelize.define('PurchaseOrderDetail', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id:   { type: DataTypes.INTEGER,     allowNull: false },
  purchase_order_id: { type: DataTypes.INTEGER,     allowNull: false },
  product_id:        { type: DataTypes.INTEGER,     allowNull: false },
  quantity_ordered: {
    type:      DataTypes.DECIMAL(12, 3),
    allowNull: false,
    validate: { min: 0.001 },
  },
  quantity_received: { type: DataTypes.DECIMAL(12, 3), allowNull: false, defaultValue: 0 },
  unit_cost: {
    type:      DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 0 },
  },
  subtotal: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
}, {
  tableName:  'purchase_order_details',
  timestamps: false,
});

module.exports = PurchaseOrderDetail;
