'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ExpenseCategory = sequelize.define('ExpenseCategory', {
  id:         { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  company_id: { type: DataTypes.BIGINT, allowNull: false },
  name:       { type: DataTypes.STRING(100), allowNull: false },
  category_type: {
    type:     DataTypes.STRING(30),
    allowNull: false,
    validate: { isIn: [['ADMINISTRATIVO','OPERATIVO','VENTAS','FINANCIERO','TRIBUTARIO','RECURSOS_HUMANOS','INVENTARIO','IMPREVISTO']] },
  },
  description: { type: DataTypes.STRING(255), allowNull: true },
  is_active:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName:  'expense_categories',
  schema:     'erp',
  timestamps: true,
  paranoid:   true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
  deletedAt:  'deleted_at',
});

module.exports = ExpenseCategory;
