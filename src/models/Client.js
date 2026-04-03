'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Client = sequelize.define('Client', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: { type: DataTypes.INTEGER, allowNull: false },
  full_name: {
    type:      DataTypes.STRING(255),
    allowNull: false,
    validate: { notEmpty: true, len: [2, 255] },
  },
  identification: {
    type:      DataTypes.STRING(20),
    allowNull: false,
    validate: { notEmpty: true, len: [10, 20] },
  },
  identification_type: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'cedula',
    validate: { isIn: [['cedula', 'ruc', 'pasaporte']] },
  },
  client_type: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'individual',
    validate: { isIn: [['individual', 'business']] },
  },
  is_default: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: false,
  },
  email:   { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
  phone:   { type: DataTypes.STRING(30),  allowNull: true },
  address: { type: DataTypes.TEXT,        allowNull: true },
  status: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'active',
    validate: { isIn: [['active', 'inactive']] },
  },
}, {
  tableName:  'clients',
  timestamps: true,
  paranoid:   true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
  deletedAt:  'deleted_at',
  hooks: {
    beforeCreate: (c) => {
      if (c.full_name)      c.full_name      = c.full_name.trim();
      if (c.identification) c.identification = c.identification.trim();
      if (c.email)          c.email          = c.email.toLowerCase().trim();
    },
    beforeUpdate: (c) => {
      if (c.changed('full_name'))      c.full_name      = c.full_name.trim();
      if (c.changed('identification')) c.identification = c.identification.trim();
      if (c.changed('email'))          c.email          = c.email.toLowerCase().trim();
    },
  },
});

module.exports = Client;
