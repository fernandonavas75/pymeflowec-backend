'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ExpensePayment = sequelize.define('ExpensePayment', {
  id:         { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  expense_id: { type: DataTypes.BIGINT, allowNull: false },
  company_id: { type: DataTypes.BIGINT, allowNull: false },
  payment_date: {
    type:         DataTypes.DATEONLY,
    allowNull:    false,
    defaultValue: DataTypes.NOW,
  },
  amount: {
    type:     DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 0.01 },
  },
  payment_method: {
    type:     DataTypes.STRING(20),
    allowNull: false,
    validate: { isIn: [['EFECTIVO','TRANSFERENCIA','TARJETA_DEBITO','TARJETA_CREDITO','CHEQUE','OTRO']] },
  },
  transfer_reference: { type: DataTypes.STRING(100), allowNull: true },
  card_contrapartida: { type: DataTypes.STRING(100), allowNull: true },
  cheque_number:      { type: DataTypes.STRING(50),  allowNull: true },
  installment_number: { type: DataTypes.SMALLINT,    allowNull: true },
  installment_total:  { type: DataTypes.SMALLINT,    allowNull: true },
  due_date:           { type: DataTypes.DATEONLY,    allowNull: true },
  status: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'PAGADO',
    validate: { isIn: [['PENDIENTE','PAGADO','VENCIDO','ANULADO']] },
  },
  notes:      { type: DataTypes.TEXT,   allowNull: true },
  created_by: { type: DataTypes.BIGINT, allowNull: false },
}, {
  tableName:  'expense_payments',
  schema:     'erp',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
});

module.exports = ExpensePayment;
