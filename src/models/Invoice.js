'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: { type: DataTypes.INTEGER, allowNull: false },
  order_id:        { type: DataTypes.INTEGER, allowNull: true },
  client_id:       { type: DataTypes.INTEGER, allowNull: true },  // NULL = Consumidor Final
  user_id:         { type: DataTypes.INTEGER, allowNull: false },
  invoice_number: {
    type:      DataTypes.STRING(50),
    allowNull: false,
    validate: { notEmpty: true },
  },
  // SRI - Facturación electrónica
  clave_acceso:          { type: DataTypes.STRING(49), allowNull: true },
  authorization_number:  { type: DataTypes.STRING(49), allowNull: true },
  sri_estado: {
    type:         DataTypes.STRING(20),
    allowNull:    true,
    defaultValue: 'pendiente',
    validate: { isIn: [['pendiente', 'enviada', 'autorizada', 'rechazada', 'anulada']] },
  },
  sri_fecha_autorizacion: { type: DataTypes.DATE,        allowNull: true },
  sri_xml_path:           { type: DataTypes.STRING(500), allowNull: true },
  sri_pdf_ride_path:      { type: DataTypes.STRING(500), allowNull: true },

  issue_date: {
    type:         DataTypes.DATEONLY,
    allowNull:    false,
    defaultValue: DataTypes.NOW,
  },
  due_date:    { type: DataTypes.DATEONLY,       allowNull: true },
  subtotal:    { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  tax:         { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  total:       { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  tax_breakdown: { type: DataTypes.JSONB,        allowNull: true },
  status: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'issued',
    validate: { isIn: [['issued', 'paid', 'partial', 'cancelled', 'overdue']] },
  },
  payment_status: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'pending',
    validate: { isIn: [['pending', 'partial', 'paid']] },
  },
}, {
  tableName:  'invoices',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

module.exports = Invoice;
