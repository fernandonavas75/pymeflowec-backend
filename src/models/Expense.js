'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Expense = sequelize.define('Expense', {
  id:         { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  company_id: { type: DataTypes.BIGINT, allowNull: false },
  category_id:        { type: DataTypes.BIGINT,       allowNull: false },
  supplier_id:        { type: DataTypes.BIGINT,       allowNull: true  },
  supplier_name_free: { type: DataTypes.STRING(150),  allowNull: true  },
  description:        { type: DataTypes.TEXT,         allowNull: false },
  expense_date: {
    type:         DataTypes.DATEONLY,
    allowNull:    false,
    defaultValue: DataTypes.NOW,
  },
  amount: {
    type:     DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 0.01 },
  },
  voucher_number: { type: DataTypes.STRING(50), allowNull: true },
  voucher_type: {
    type:     DataTypes.STRING(30),
    allowNull: true,
    validate: { isIn: [['FACTURA','NOTA_VENTA','RECIBO','LIQUIDACION','SIN_COMPROBANTE','OTRO', null]] },
  },
  payment_status: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'PENDIENTE',
    validate: { isIn: [['PENDIENTE','PARCIAL','PAGADO','ANULADO']] },
  },
  notes:      { type: DataTypes.TEXT,   allowNull: true },
  created_by: { type: DataTypes.BIGINT, allowNull: false },
}, {
  tableName:  'expenses',
  schema:     'erp',
  timestamps: true,
  paranoid:   true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
  deletedAt:  'deleted_at',
});

module.exports = Expense;
