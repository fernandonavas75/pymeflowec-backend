'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type:      DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 255],
    },
  },
  description: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type:      DataTypes.STRING(100),
    allowNull: true,
  },
  stock: {
    type:         DataTypes.INTEGER,
    allowNull:    false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  unit_price: {
    type:      DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  status: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive']],
    },
  },
}, {
  tableName:  'products',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
  hooks: {
    beforeCreate: (product) => {
      if (product.name)     product.name     = product.name.trim();
      if (product.category) product.category = product.category.trim();
    },
    beforeUpdate: (product) => {
      if (product.changed('name'))     product.name     = product.name.trim();
      if (product.changed('category')) product.category = product.category.trim();
    },
  },
});

module.exports = Product;