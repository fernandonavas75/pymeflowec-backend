'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type:          DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey:    true,
  },
  company_id:   { type: DataTypes.BIGINT, allowNull: false },
  supplier_id:  { type: DataTypes.BIGINT, allowNull: true  },
  tax_rate_id:  { type: DataTypes.BIGINT, allowNull: true  },
  sku: {
    type:      DataTypes.STRING(50),
    allowNull: true,
  },
  name: {
    type:      DataTypes.STRING(150),
    allowNull: false,
    validate: { notEmpty: true, len: [2, 150] },
  },
  description:    { type: DataTypes.TEXT,        allowNull: true },
  purchase_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, validate: { min: 0 } },
  sale_price:     { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, validate: { min: 0 } },
  stock:          { type: DataTypes.INTEGER,        allowNull: false, defaultValue: 0, validate: { min: 0 } },
  min_stock:      { type: DataTypes.INTEGER,        allowNull: false, defaultValue: 0, validate: { min: 0 } },
  status: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'ACTIVE',
    validate: { isIn: [['ACTIVE', 'INACTIVE']] },
  },
}, {
  tableName:  'products',
  schema:     'erp',
  timestamps: true,
  paranoid:   true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
  deletedAt:  'deleted_at',
  hooks: {
    beforeCreate: (p) => { if (p.name) p.name = p.name.trim(); },
    beforeUpdate: (p) => { if (p.changed('name')) p.name = p.name.trim(); },
  },
});

module.exports = Product;
