'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: { type: DataTypes.INTEGER, allowNull: false },
  invoice_id:      { type: DataTypes.INTEGER, allowNull: false },
  user_id:         { type: DataTypes.INTEGER, allowNull: false },
  payment_method: {
    type:      DataTypes.STRING(30),
    allowNull: false,
    validate: { isIn: [['cash', 'transfer', 'card', 'credit', 'other']] },
  },
  amount: {
    type:      DataTypes.DECIMAL(14, 2),
    allowNull: false,
    validate: { min: 0.01 },
  },
  reference_number: { type: DataTypes.STRING(100), allowNull: true },
  payment_date: {
    type:         DataTypes.DATEONLY,
    allowNull:    false,
    defaultValue: DataTypes.NOW,
  },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName:  'payments',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
});

module.exports = Payment;
