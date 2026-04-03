'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InventoryMovement = sequelize.define('InventoryMovement', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id:      { type: DataTypes.INTEGER, allowNull: false },
  movement_type: {
    type:      DataTypes.STRING(20),
    allowNull: false,
    validate: { isIn: [['in', 'out', 'adjustment']] },
  },
  quantity:      { type: DataTypes.DECIMAL(12, 3), allowNull: false },
  stock_before:  { type: DataTypes.DECIMAL(12, 3), allowNull: false },
  stock_after:   { type: DataTypes.DECIMAL(12, 3), allowNull: false },
  reference_type: { type: DataTypes.STRING(50),  allowNull: true },
  reference_id:   { type: DataTypes.INTEGER,     allowNull: true },
  reason:         { type: DataTypes.STRING(255), allowNull: true },
  user_id:        { type: DataTypes.INTEGER,     allowNull: true },
}, {
  tableName:  'inventory_movements',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
});

module.exports = InventoryMovement;
