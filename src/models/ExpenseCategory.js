'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ExpenseCategory = sequelize.define('ExpenseCategory', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: { type: DataTypes.INTEGER, allowNull: false },
  name: {
    type:      DataTypes.STRING(150),
    allowNull: false,
    validate: { notEmpty: true },
  },
  description: { type: DataTypes.TEXT,    allowNull: true },
  is_active:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName:  'expense_categories',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
  hooks: {
    beforeCreate: (c) => { if (c.name) c.name = c.name.trim(); },
    beforeUpdate: (c) => { if (c.changed('name')) c.name = c.name.trim(); },
  },
});

module.exports = ExpenseCategory;
