'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CashRegister = sequelize.define('CashRegister', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: { type: DataTypes.INTEGER,     allowNull: false },
  user_id:         { type: DataTypes.INTEGER,     allowNull: false },
  opened_at: {
    type:         DataTypes.DATE,
    allowNull:    false,
    defaultValue: DataTypes.NOW,
  },
  closed_at:        { type: DataTypes.DATE,        allowNull: true },
  opening_amount:   { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  expected_amount:  { type: DataTypes.DECIMAL(14, 2), allowNull: true },
  actual_amount:    { type: DataTypes.DECIMAL(14, 2), allowNull: true },
  difference:       { type: DataTypes.DECIMAL(14, 2), allowNull: true },
  status: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'open',
    validate: { isIn: [['open', 'closed']] },
  },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName:  'cash_registers',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

module.exports = CashRegister;
