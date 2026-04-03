'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: { type: DataTypes.INTEGER, allowNull: false },
  category_id:     { type: DataTypes.INTEGER, allowNull: true },
  tax_rate_id:     { type: DataTypes.INTEGER, allowNull: true },
  name: {
    type:      DataTypes.STRING(255),
    allowNull: false,
    validate: { notEmpty: true, len: [2, 255] },
  },
  description: { type: DataTypes.TEXT,       allowNull: true },
  barcode:     { type: DataTypes.STRING(50), allowNull: true },
  sku:         { type: DataTypes.STRING(50), allowNull: true },
  unit: {
    type:         DataTypes.STRING(30),
    allowNull:    false,
    defaultValue: 'unidad',
    validate: { isIn: [['unidad', 'kg', 'lb', 'litro', 'metro', 'paquete', 'caja', 'docena', 'funda']] },
  },
  stock: {
    type:         DataTypes.DECIMAL(12, 3),
    allowNull:    false,
    defaultValue: 0,
    validate: { min: 0 },
  },
  min_stock: {
    type:         DataTypes.DECIMAL(12, 3),
    allowNull:    false,
    defaultValue: 0,
  },
  cost_price: {
    type:         DataTypes.DECIMAL(12, 2),
    allowNull:    false,
    defaultValue: 0,
    validate: { min: 0 },
  },
  unit_price: {
    type:      DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 0 },
  },
  status: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'active',
    validate: { isIn: [['active', 'inactive']] },
  },
}, {
  tableName:  'products',
  timestamps: true,
  paranoid:   true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
  deletedAt:  'deleted_at',
  hooks: {
    beforeCreate: (p) => {
      if (p.name) p.name = p.name.trim();
    },
    beforeUpdate: (p) => {
      if (p.changed('name')) p.name = p.name.trim();
    },
  },
});

module.exports = Product;
