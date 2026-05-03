'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ExpenseBudget = sequelize.define('ExpenseBudget', {
  id:          { type: DataTypes.BIGINT,        autoIncrement: true, primaryKey: true },
  company_id:  { type: DataTypes.BIGINT,        allowNull: false },
  category_id: { type: DataTypes.BIGINT,        allowNull: false },
  period_type: {
    type:     DataTypes.STRING(10),
    allowNull: false,
    validate: { isIn: [['MONTHLY','ANNUAL']] },
  },
  period_year:  { type: DataTypes.SMALLINT,      allowNull: false },
  period_month: { type: DataTypes.SMALLINT,      allowNull: true  },
  budgeted_amount: {
    type:     DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 0.01 },
  },
  notes:      { type: DataTypes.TEXT,   allowNull: true },
  created_by: { type: DataTypes.BIGINT, allowNull: false },
}, {
  tableName:  'expense_budgets',
  schema:     'erp',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

module.exports = ExpenseBudget;
