'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TaxRate = sequelize.define('TaxRate', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  name: {
    type:      DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true },
  },
  percentage: {
    type:      DataTypes.DECIMAL(5, 4),
    allowNull: false,
    validate: { min: 0, max: 1 },
  },
  sri_code:            { type: DataTypes.STRING(10), allowNull: true },
  sri_percentage_code: { type: DataTypes.STRING(10), allowNull: true },
  effective_from: {
    type:         DataTypes.DATEONLY,
    allowNull:    false,
    defaultValue: DataTypes.NOW,
  },
  effective_until: { type: DataTypes.DATEONLY, allowNull: true },
  is_active: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true,
  },
  description: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName:  'tax_rates',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
});

module.exports = TaxRate;
