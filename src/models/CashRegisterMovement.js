'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CashRegisterMovement = sequelize.define('CashRegisterMovement', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id:  { type: DataTypes.INTEGER,     allowNull: false },
  cash_register_id: { type: DataTypes.INTEGER,     allowNull: false },
  movement_type: {
    type:      DataTypes.STRING(20),
    allowNull: false,
    validate: { isIn: [['sale', 'withdrawal', 'deposit', 'refund']] },
  },
  amount:      { type: DataTypes.DECIMAL(14, 2), allowNull: false },
  payment_id:  { type: DataTypes.INTEGER,        allowNull: true },
  description: { type: DataTypes.STRING(255),   allowNull: true },
}, {
  tableName:  'cash_register_movements',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
});

module.exports = CashRegisterMovement;
