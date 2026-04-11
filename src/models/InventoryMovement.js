'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InventoryMovement = sequelize.define('InventoryMovement', {
  id: {
    type:          DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey:    true,
  },
  company_id:  { type: DataTypes.BIGINT, allowNull: false },
  product_id:  { type: DataTypes.BIGINT, allowNull: false },
  movement_type: {
    type:      DataTypes.STRING(20),
    allowNull: false,
    validate: { isIn: [['IN', 'OUT', 'ADJUSTMENT']] },
  },
  quantity: {
    type:      DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 },
  },
  reference_type: {
    type:      DataTypes.STRING(20),
    allowNull: false,
    validate: { isIn: [['PURCHASE', 'SALE', 'MANUAL']] },
  },
  reference_id: { type: DataTypes.BIGINT, allowNull: true },
  notes:        { type: DataTypes.TEXT,   allowNull: true },
  created_by:   { type: DataTypes.BIGINT, allowNull: false },
}, {
  tableName:  'inventory_movements',
  schema:     'erp',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
});

module.exports = InventoryMovement;
