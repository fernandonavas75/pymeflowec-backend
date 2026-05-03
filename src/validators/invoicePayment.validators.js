'use strict';

const { body } = require('express-validator');

const PAYMENT_METHODS = ['EFECTIVO','TRANSFERENCIA','TARJETA_DEBITO','TARJETA_CREDITO','CHEQUE','OTRO'];

const createRules = [
  body('invoice_id').isInt({ min: 1 }).withMessage('invoice_id es requerido.'),
  body('amount').isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0.'),
  body('payment_method').isIn(PAYMENT_METHODS).withMessage('Método de pago inválido.'),
  body('payment_date').optional().isDate().withMessage('Fecha inválida.'),
  body('transfer_reference').optional({ nullable: true }).trim(),
  body('card_contrapartida').optional({ nullable: true }).trim(),
  body('cheque_number').optional({ nullable: true }).trim(),
  body('installment_number').optional({ nullable: true }).isInt({ min: 1 }),
  body('installment_total').optional({ nullable: true }).isInt({ min: 1 }),
  body('due_date').optional({ nullable: true }).isDate(),
  body('status').optional().isIn(['PENDIENTE','COBRADO']).withMessage('Estado inválido.'),
  body('notes').optional({ nullable: true }).trim(),
];

module.exports = { createRules };
