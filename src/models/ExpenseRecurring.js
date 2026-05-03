'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ExpenseRecurring = sequelize.define('ExpenseRecurring', {
  id:                 { type: DataTypes.BIGINT,       autoIncrement: true, primaryKey: true },
  company_id:         { type: DataTypes.BIGINT,       allowNull: false },
  category_id:        { type: DataTypes.BIGINT,       allowNull: false },
  supplier_id:        { type: DataTypes.BIGINT,       allowNull: true  },
  supplier_name_free: { type: DataTypes.STRING(150),  allowNull: true  },
  description:        { type: DataTypes.TEXT,         allowNull: false },
  amount: {
    type:     DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 0.01 },
  },
  day_of_month: {
    type:     DataTypes.SMALLINT,
    allowNull: false,
    validate: { min: 1, max: 28 },
  },
  voucher_type: {
    type:     DataTypes.STRING(30),
    allowNull: true,
    validate: { isIn: [['FACTURA','NOTA_VENTA','RECIBO','LIQUIDACION','SIN_COMPROBANTE','OTRO', null]] },
  },
  default_payment_method: {
    type:     DataTypes.STRING(20),
    allowNull: true,
    validate: { isIn: [['EFECTIVO','TRANSFERENCIA','TARJETA_DEBITO','TARJETA_CREDITO','CHEQUE','OTRO', null]] },
  },
  is_active:         { type: DataTypes.BOOLEAN,    allowNull: false, defaultValue: true },
  starts_at:         { type: DataTypes.DATEONLY,   allowNull: false  },
  ends_at:           { type: DataTypes.DATEONLY,   allowNull: true   },
  last_generated_at: { type: DataTypes.DATEONLY,   allowNull: true   },
  created_by:        { type: DataTypes.BIGINT,     allowNull: false  },
}, {
  tableName:  'expense_recurring',
  schema:     'erp',
  timestamps: true,
  paranoid:   true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
  deletedAt:  'deleted_at',
});

module.exports = ExpenseRecurring;
