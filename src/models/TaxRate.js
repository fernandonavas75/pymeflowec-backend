'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// percentage: 0–100 (p.ej. 15 = 15%)  — distinto del esquema anterior (0–1)
const TaxRate = sequelize.define('TaxRate', {
  id: {
    type:          DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey:    true,
  },
  company_id: { type: DataTypes.BIGINT, allowNull: false },
  tax_name: {
    type:      DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true },
  },
  percentage: {
    type:      DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: { min: 0, max: 100 },
  },
  is_active: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true,
  },
  valid_from:  { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  valid_to:    { type: DataTypes.DATEONLY, allowNull: true },
}, {
  tableName:  'tax_rates',
  schema:     'erp',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

module.exports = TaxRate;
