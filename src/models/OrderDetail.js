'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrderDetail = sequelize.define('OrderDetail', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  order_id: {
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
  tableName:  'order_details',
  timestamps: false,
});

module.exports = OrderDetail;