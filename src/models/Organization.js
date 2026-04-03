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
    validate: { notEmpty: true, len: [2, 255] },
  },
  ruc: {
    type:      DataTypes.STRING(20),
    allowNull: false,
    unique:    true,
    validate: { notEmpty: true, len: [10, 20] },
  },
  email:    { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
  phone:    { type: DataTypes.STRING(30),  allowNull: true },
  address:  { type: DataTypes.TEXT,        allowNull: true },
  city:     { type: DataTypes.STRING(100), allowNull: true },
  province: { type: DataTypes.STRING(100), allowNull: true },
  logo_url: { type: DataTypes.STRING(500), allowNull: true },
  status: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'active',
    validate: { isIn: [['active', 'inactive']] },
  },
  default_tax_id: { type: DataTypes.INTEGER, allowNull: true },
  currency: {
    type:         DataTypes.STRING(3),
    allowNull:    false,
    defaultValue: 'USD',
  },
  // SRI - Facturación electrónica
  sri_ambiente: {
    type:         DataTypes.STRING(1),
    allowNull:    false,
    defaultValue: '1',
    validate: { isIn: [['1', '2']] },
  },
  sri_tipo_emision: {
    type:         DataTypes.STRING(1),
    allowNull:    false,
    defaultValue: '1',
    validate: { isIn: [['1', '2']] },
  },
  sri_obligado_contab:        { type: DataTypes.BOOLEAN,     allowNull: false, defaultValue: false },
  sri_contribuyente_especial: { type: DataTypes.STRING(20),  allowNull: true },
  sri_firma_path:             { type: DataTypes.STRING(500), allowNull: true },
  sri_secuencial_factura:     { type: DataTypes.INTEGER,     allowNull: false, defaultValue: 0 },
  sri_secuencial_nc:          { type: DataTypes.INTEGER,     allowNull: false, defaultValue: 0 },
  sri_establecimiento:        { type: DataTypes.STRING(3),   allowNull: false, defaultValue: '001' },
  sri_punto_emision:          { type: DataTypes.STRING(3),   allowNull: false, defaultValue: '001' },
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
