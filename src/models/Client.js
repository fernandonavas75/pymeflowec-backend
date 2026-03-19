'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Client = sequelize.define('Client', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  full_name: {
    type:      DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 255],
    },
  },
  identification: {
    type:      DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: true,
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
  tableName:  'clients',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
  hooks: {
    beforeCreate: (client) => {
      if (client.full_name)      client.full_name      = client.full_name.trim();
      if (client.identification) client.identification = client.identification.trim();
      if (client.email)          client.email          = client.email.toLowerCase().trim();
    },
    beforeUpdate: (client) => {
      if (client.changed('full_name'))      client.full_name      = client.full_name.trim();
      if (client.changed('identification')) client.identification = client.identification.trim();
      if (client.changed('email'))          client.email          = client.email.toLowerCase().trim();
    },
  },
});

module.exports = Client;