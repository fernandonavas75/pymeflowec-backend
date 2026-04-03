'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Supplier = sequelize.define('Supplier', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: { type: DataTypes.INTEGER, allowNull: false },
  business_name: {
    type:      DataTypes.STRING(255),
    allowNull: false,
    validate: { notEmpty: true, len: [2, 255] },
  },
  ruc:           { type: DataTypes.STRING(20),  allowNull: true },
  contact_name:  { type: DataTypes.STRING(255), allowNull: true },
  email:         { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
  phone:         { type: DataTypes.STRING(30),  allowNull: true },
  address:       { type: DataTypes.TEXT,        allowNull: true },
  payment_terms: { type: DataTypes.STRING(100), allowNull: true },
  notes:         { type: DataTypes.TEXT,        allowNull: true },
  status: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'active',
    validate: { isIn: [['active', 'inactive']] },
  },
}, {
  tableName:  'suppliers',
  timestamps: true,
  paranoid:   true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
  deletedAt:  'deleted_at',
  hooks: {
    beforeCreate: (s) => {
      if (s.business_name) s.business_name = s.business_name.trim();
      if (s.contact_name)  s.contact_name  = s.contact_name.trim();
      if (s.email)         s.email         = s.email.toLowerCase().trim();
    },
    beforeUpdate: (s) => {
      if (s.changed('business_name')) s.business_name = s.business_name.trim();
      if (s.changed('contact_name'))  s.contact_name  = s.contact_name.trim();
      if (s.changed('email'))         s.email         = s.email.toLowerCase().trim();
    },
  },
});

module.exports = Supplier;
