'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductCategory = sequelize.define('ProductCategory', {
  id: {
    type:          DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey:    true,
  },
  company_id: { type: DataTypes.BIGINT, allowNull: false },
  name: {
    type:      DataTypes.STRING(100),
    allowNull: false,
    validate:  { notEmpty: true, len: [2, 100] },
  },
  description: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'ACTIVE',
    validate:     { isIn: [['ACTIVE', 'INACTIVE']] },
  },
}, {
  tableName:  'product_categories',
  schema:     'erp',
  timestamps: true,
  paranoid:   true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
  deletedAt:  'deleted_at',
  hooks: {
    beforeCreate: (c) => { if (c.name) c.name = c.name.trim(); },
    beforeUpdate: (c) => { if (c.changed('name')) c.name = c.name.trim(); },
  },
});

module.exports = ProductCategory;
