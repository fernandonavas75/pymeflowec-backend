'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PriceHistory = sequelize.define('PriceHistory', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id:      { type: DataTypes.INTEGER, allowNull: false },
  price_type: {
    type:      DataTypes.STRING(10),
    allowNull: false,
    validate: { isIn: [['sale', 'cost']] },
  },
  old_price:  { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  new_price:  { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  changed_by: { type: DataTypes.INTEGER,        allowNull: true },
  reason:     { type: DataTypes.STRING(255),    allowNull: true },
}, {
  tableName:  'price_history',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
});

module.exports = PriceHistory;
