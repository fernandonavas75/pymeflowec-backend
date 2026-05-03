'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PettyCash = sequelize.define('PettyCash', {
  id:         { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  company_id: { type: DataTypes.BIGINT, allowNull: false },
  name: {
    type:         DataTypes.STRING(100),
    allowNull:    false,
    defaultValue: 'Caja Chica',
  },
  opening_amount: {
    type:     DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 0.01 },
  },
  current_balance: {
    type:         DataTypes.DECIMAL(12, 2),
    allowNull:    false,
    defaultValue: 0,
  },
  status: {
    type:         DataTypes.STRING(10),
    allowNull:    false,
    defaultValue: 'OPEN',
    validate: { isIn: [['OPEN','CLOSED']] },
  },
  opened_by: { type: DataTypes.BIGINT, allowNull: false },
  opened_at: { type: DataTypes.DATE,   allowNull: false, defaultValue: DataTypes.NOW },
  closed_by: { type: DataTypes.BIGINT, allowNull: true  },
  closed_at: { type: DataTypes.DATE,   allowNull: true  },
  closing_amount_reported: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  notes:                   { type: DataTypes.TEXT,           allowNull: true },
}, {
  tableName:  'petty_cash',
  schema:     'erp',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

module.exports = PettyCash;
