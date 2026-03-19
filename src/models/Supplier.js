'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Supplier = sequelize.define('Supplier', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  business_name: {
    type:      DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 255],
    },
  },
  contact_name: {
    type:      DataTypes.STRING(255),
    allowNull: true,
  },
  email: {
    type:      DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type:      DataTypes.STRING(30),
    allowNull: true,
  },
  address: {
    type:      DataTypes.TEXT,
    allowNull: true,
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
  tableName:  'suppliers',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
  hooks: {
    beforeCreate: (supplier) => {
      if (supplier.business_name) supplier.business_name = supplier.business_name.trim();
      if (supplier.contact_name)  supplier.contact_name  = supplier.contact_name.trim();
      if (supplier.email)         supplier.email         = supplier.email.toLowerCase().trim();
    },
    beforeUpdate: (supplier) => {
      if (supplier.changed('business_name')) supplier.business_name = supplier.business_name.trim();
      if (supplier.changed('contact_name'))  supplier.contact_name  = supplier.contact_name.trim();
      if (supplier.changed('email'))         supplier.email         = supplier.email.toLowerCase().trim();
    },
  },
});

module.exports = Supplier;