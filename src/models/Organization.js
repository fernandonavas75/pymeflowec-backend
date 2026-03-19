'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Organization = sequelize.define('Organization', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  name: {
    type:      DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 255],
    },
  },
  ruc: {
    type:      DataTypes.STRING(20),
    allowNull: false,
    unique:    true,
    validate: {
      notEmpty: true,
      len: [10, 20],
    },
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
  tableName:  'organizations',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
  hooks: {
    beforeCreate: (org) => {
      if (org.name) org.name = org.name.trim();
      if (org.ruc)  org.ruc  = org.ruc.trim();
    },
    beforeUpdate: (org) => {
      if (org.changed('name')) org.name = org.name.trim();
      if (org.changed('ruc'))  org.ruc  = org.ruc.trim();
    },
  },
});

module.exports = Organization;