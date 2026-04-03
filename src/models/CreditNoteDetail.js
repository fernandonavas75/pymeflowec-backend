'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CreditNoteDetail = sequelize.define('CreditNoteDetail', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  organization_id: { type: DataTypes.INTEGER,     allowNull: false },
  credit_note_id:  { type: DataTypes.INTEGER,     allowNull: false },
  product_id:      { type: DataTypes.INTEGER,     allowNull: false },
  quantity: {
    type:      DataTypes.DECIMAL(12, 3),
    allowNull: false,
    validate: { min: 0.001 },
  },
  unit_price: {
    type:      DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 0 },
  },
  tax_rate: { type: DataTypes.DECIMAL(5, 4),  allowNull: false, defaultValue: 0 },
  subtotal: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
}, {
  tableName:  'credit_note_details',
  timestamps: false,
});

module.exports = CreditNoteDetail;
