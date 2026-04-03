'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CreditNote = sequelize.define('CreditNote', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id:   { type: DataTypes.INTEGER, allowNull: false },
  invoice_id:        { type: DataTypes.INTEGER, allowNull: false },
  user_id:           { type: DataTypes.INTEGER, allowNull: false },
  credit_note_number: {
    type:      DataTypes.STRING(50),
    allowNull: false,
    validate: { notEmpty: true },
  },
  // SRI
  clave_acceso:           { type: DataTypes.STRING(49), allowNull: true },
  authorization_number:   { type: DataTypes.STRING(49), allowNull: true },
  sri_estado: {
    type:         DataTypes.STRING(20),
    allowNull:    true,
    defaultValue: 'pendiente',
    validate: { isIn: [['pendiente', 'enviada', 'autorizada', 'rechazada', 'anulada']] },
  },
  sri_fecha_autorizacion: { type: DataTypes.DATE,        allowNull: true },
  sri_xml_path:           { type: DataTypes.STRING(500), allowNull: true },
  sri_pdf_ride_path:      { type: DataTypes.STRING(500), allowNull: true },

  issue_date: { type: DataTypes.DATEONLY,       allowNull: false, defaultValue: DataTypes.NOW },
  reason:     { type: DataTypes.STRING(255),    allowNull: false },
  subtotal:   { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  tax:        { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  total:      { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  status: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'issued',
    validate: { isIn: [['issued', 'applied', 'cancelled']] },
  },
}, {
  tableName:  'credit_notes',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

module.exports = CreditNote;
