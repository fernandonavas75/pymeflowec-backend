'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PettyCashMovement = sequelize.define('PettyCashMovement', {
  id:            { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  petty_cash_id: { type: DataTypes.BIGINT, allowNull: false },
  company_id:    { type: DataTypes.BIGINT, allowNull: false },
  movement_type: {
    type:     DataTypes.STRING(15),
    allowNull: false,
    validate: { isIn: [['EXPENSE','REPLENISH','ADJUSTMENT']] },
  },
  category_id:    { type: DataTypes.BIGINT,       allowNull: true  },
  amount: {
    type:     DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 0.01 },
  },
  description:    { type: DataTypes.TEXT,         allowNull: false },
  voucher_number: { type: DataTypes.STRING(50),   allowNull: true  },
  balance_after:  { type: DataTypes.DECIMAL(12,2), allowNull: false },
  created_by:     { type: DataTypes.BIGINT,        allowNull: false },
}, {
  tableName:  'petty_cash_movements',
  schema:     'erp',
  timestamps: true,
  updatedAt:  false,
  createdAt:  'created_at',
});

module.exports = PettyCashMovement;
