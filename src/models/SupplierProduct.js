'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SupplierProduct = sequelize.define('SupplierProduct', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: { type: DataTypes.INTEGER,     allowNull: false },
  supplier_id:     { type: DataTypes.INTEGER,     allowNull: false },
  product_id:      { type: DataTypes.INTEGER,     allowNull: false },
  cost_price: {
    type:      DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 0 },
  },
  lead_time_days: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
  min_order_qty:  { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
  is_preferred:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  last_purchase:  { type: DataTypes.DATEONLY, allowNull: true },
  notes:          { type: DataTypes.TEXT,    allowNull: true },
  is_active:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName:  'supplier_products',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

module.exports = SupplierProduct;
