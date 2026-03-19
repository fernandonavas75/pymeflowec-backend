'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  client_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  order_date: {
    type:         DataTypes.DATEONLY,
    allowNull:    false,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type:         DataTypes.STRING(30),
    allowNull:    false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']],
    },
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
}, {
  tableName:  'orders',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

module.exports = Order;