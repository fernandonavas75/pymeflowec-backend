'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define('Category', {
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
  parent_id:  { type: DataTypes.INTEGER, allowNull: true },
  sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  is_active:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName:  'categories',
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

module.exports = Category;
