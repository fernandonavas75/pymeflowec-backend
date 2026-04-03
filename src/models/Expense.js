'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Expense = sequelize.define('Expense', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: { type: DataTypes.INTEGER, allowNull: false },
  category_id:     { type: DataTypes.INTEGER, allowNull: false },
  user_id:         { type: DataTypes.INTEGER, allowNull: false },
  supplier_id:     { type: DataTypes.INTEGER, allowNull: true },
  amount: {
    type:      DataTypes.DECIMAL(14, 2),
    allowNull: false,
    validate: { min: 0.01 },
  },
  expense_date: {
    type:         DataTypes.DATEONLY,
    allowNull:    false,
    defaultValue: DataTypes.NOW,
  },
  payment_method: {
    type:         DataTypes.STRING(30),
    allowNull:    false,
    defaultValue: 'cash',
    validate: { isIn: [['cash', 'transfer', 'card', 'other']] },
  },
  reference_number: { type: DataTypes.STRING(100), allowNull: true },
  description:      { type: DataTypes.STRING(500), allowNull: true },
  is_recurring: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: false,
  },
  recurrence_day: {
    type:      DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 31 },
  },
  status: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'registered',
    validate: { isIn: [['registered', 'cancelled']] },
  },
}, {
  tableName:  'expenses',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

module.exports = Expense;
