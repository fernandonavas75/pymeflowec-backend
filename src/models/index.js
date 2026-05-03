'use strict';

const Company              = require('./Company');
const Role                 = require('./Role');
const User                 = require('./User');
const Module               = require('./Module');
const CompanyModule        = require('./CompanyModule');
const CompanyModuleRequest = require('./CompanyModuleRequest');
const Supplier             = require('./Supplier');
const StoreCustomer        = require('./StoreCustomer');
const TaxRate              = require('./TaxRate');
const Product              = require('./Product');
const Invoice              = require('./Invoice');
const InvoiceDetail        = require('./InvoiceDetail');
const InvoicePayment       = require('./InvoicePayment');
const InventoryMovement    = require('./InventoryMovement');
const ExpenseCategory      = require('./ExpenseCategory');
const Expense              = require('./Expense');
const ExpensePayment       = require('./ExpensePayment');
const ExpenseBudget        = require('./ExpenseBudget');
const ExpenseRecurring     = require('./ExpenseRecurring');
const PettyCash            = require('./PettyCash');
const PettyCashMovement    = require('./PettyCashMovement');
const AuditLog             = require('./AuditLog');
const SystemLog            = require('./SystemLog');

// ── Role ↔ User ───────────────────────────────────────────────────
Role.hasMany(User,   { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// ── Company ↔ User ────────────────────────────────────────────────
Company.hasMany(User,   { foreignKey: 'company_id', as: 'users' });
User.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

// ── Company ↔ tenant tables ───────────────────────────────────────
const companyHasMany = (Model, as) =>
  Company.hasMany(Model, { foreignKey: 'company_id', as });

companyHasMany(Supplier,          'suppliers');
companyHasMany(StoreCustomer,     'customers');
companyHasMany(TaxRate,           'taxRates');
companyHasMany(Product,           'products');
companyHasMany(Invoice,           'invoices');
companyHasMany(InvoicePayment,    'invoicePayments');
companyHasMany(InventoryMovement, 'inventoryMovements');
companyHasMany(ExpenseCategory,   'expenseCategories');
companyHasMany(Expense,           'expenses');
companyHasMany(ExpensePayment,    'expensePayments');
companyHasMany(ExpenseBudget,     'expenseBudgets');
companyHasMany(ExpenseRecurring,  'expenseRecurrings');
companyHasMany(PettyCash,         'pettyCashes');
companyHasMany(PettyCashMovement, 'pettyCashMovements');
companyHasMany(AuditLog,          'auditLogs');
companyHasMany(SystemLog,         'systemLogs');
companyHasMany(CompanyModule,     'companyModules');
companyHasMany(CompanyModuleRequest, 'moduleRequests');

const belongsToCompany = (Model) =>
  Model.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

[Supplier, StoreCustomer, TaxRate, Product, Invoice, InvoicePayment,
 InventoryMovement, ExpenseCategory, Expense, ExpensePayment,
 ExpenseBudget, ExpenseRecurring, PettyCash, PettyCashMovement,
 AuditLog, SystemLog, CompanyModule, CompanyModuleRequest].forEach(belongsToCompany);

// ── Supplier ↔ Product ────────────────────────────────────────────
Supplier.hasMany(Product,   { foreignKey: 'supplier_id', as: 'products' });
Product.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

// ── TaxRate ↔ Product ─────────────────────────────────────────────
TaxRate.hasMany(Product,   { foreignKey: 'tax_rate_id', as: 'products' });
Product.belongsTo(TaxRate, { foreignKey: 'tax_rate_id', as: 'taxRate' });

// ── Invoice ───────────────────────────────────────────────────────
StoreCustomer.hasMany(Invoice,   { foreignKey: 'customer_id', as: 'invoices' });
Invoice.belongsTo(StoreCustomer, { foreignKey: 'customer_id', as: 'customer' });

User.hasMany(Invoice,   { foreignKey: 'created_by', as: 'invoices' });
Invoice.belongsTo(User, { foreignKey: 'created_by', as: 'createdBy' });

// ── InvoiceDetail ─────────────────────────────────────────────────
Invoice.hasMany(InvoiceDetail,    { foreignKey: 'invoice_id', as: 'details' });
InvoiceDetail.belongsTo(Invoice,  { foreignKey: 'invoice_id', as: 'invoice' });

Product.hasMany(InvoiceDetail,    { foreignKey: 'product_id', as: 'invoiceDetails' });
InvoiceDetail.belongsTo(Product,  { foreignKey: 'product_id', as: 'product' });

TaxRate.hasMany(InvoiceDetail,    { foreignKey: 'tax_rate_id', as: 'invoiceDetails' });
InvoiceDetail.belongsTo(TaxRate,  { foreignKey: 'tax_rate_id', as: 'taxRate' });

Company.hasMany(InvoiceDetail,    { foreignKey: 'company_id', as: 'invoiceDetails' });
InvoiceDetail.belongsTo(Company,  { foreignKey: 'company_id', as: 'company' });

// ── InvoicePayment ────────────────────────────────────────────────
Invoice.hasMany(InvoicePayment,    { foreignKey: 'invoice_id', as: 'payments' });
InvoicePayment.belongsTo(Invoice,  { foreignKey: 'invoice_id', as: 'invoice' });

User.hasMany(InvoicePayment,    { foreignKey: 'created_by', as: 'invoicePayments' });
InvoicePayment.belongsTo(User,  { foreignKey: 'created_by', as: 'creator' });

// ── InventoryMovement ─────────────────────────────────────────────
Product.hasMany(InventoryMovement,   { foreignKey: 'product_id', as: 'movements' });
InventoryMovement.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

User.hasMany(InventoryMovement,      { foreignKey: 'created_by', as: 'inventoryMovements' });
InventoryMovement.belongsTo(User,    { foreignKey: 'created_by', as: 'createdBy' });

// ── ExpenseCategory ───────────────────────────────────────────────
ExpenseCategory.hasMany(Expense,         { foreignKey: 'category_id', as: 'expenses' });
Expense.belongsTo(ExpenseCategory,       { foreignKey: 'category_id', as: 'category' });

ExpenseCategory.hasMany(ExpenseBudget,   { foreignKey: 'category_id', as: 'budgets' });
ExpenseBudget.belongsTo(ExpenseCategory, { foreignKey: 'category_id', as: 'category' });

ExpenseCategory.hasMany(ExpenseRecurring, { foreignKey: 'category_id', as: 'recurringTemplates' });
ExpenseRecurring.belongsTo(ExpenseCategory, { foreignKey: 'category_id', as: 'category' });

ExpenseCategory.hasMany(PettyCashMovement, { foreignKey: 'category_id', as: 'pettyCashMovements' });
PettyCashMovement.belongsTo(ExpenseCategory, { foreignKey: 'category_id', as: 'category' });

// ── Expense ───────────────────────────────────────────────────────
Supplier.hasMany(Expense,   { foreignKey: 'supplier_id', as: 'expenses' });
Expense.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

User.hasMany(Expense,   { foreignKey: 'created_by', as: 'expenses' });
Expense.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

Expense.hasMany(ExpensePayment,    { foreignKey: 'expense_id', as: 'payments' });
ExpensePayment.belongsTo(Expense,  { foreignKey: 'expense_id', as: 'expense' });

// ── ExpensePayment ────────────────────────────────────────────────
User.hasMany(ExpensePayment,    { foreignKey: 'created_by', as: 'expensePayments' });
ExpensePayment.belongsTo(User,  { foreignKey: 'created_by', as: 'creator' });

// ── ExpenseBudget ─────────────────────────────────────────────────
User.hasMany(ExpenseBudget,    { foreignKey: 'created_by', as: 'expenseBudgets' });
ExpenseBudget.belongsTo(User,  { foreignKey: 'created_by', as: 'creator' });

// ── ExpenseRecurring ──────────────────────────────────────────────
Supplier.hasMany(ExpenseRecurring,   { foreignKey: 'supplier_id', as: 'recurringExpenses' });
ExpenseRecurring.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

User.hasMany(ExpenseRecurring,   { foreignKey: 'created_by', as: 'recurringExpenses' });
ExpenseRecurring.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ── PettyCash ─────────────────────────────────────────────────────
User.hasMany(PettyCash,    { foreignKey: 'opened_by', as: 'openedPettyCashes' });
PettyCash.belongsTo(User,  { foreignKey: 'opened_by', as: 'openedBy' });
PettyCash.belongsTo(User,  { foreignKey: 'closed_by', as: 'closedBy' });

PettyCash.hasMany(PettyCashMovement,    { foreignKey: 'petty_cash_id', as: 'movements' });
PettyCashMovement.belongsTo(PettyCash,  { foreignKey: 'petty_cash_id', as: 'pettyCash' });

User.hasMany(PettyCashMovement,    { foreignKey: 'created_by', as: 'pettyCashMovements' });
PettyCashMovement.belongsTo(User,  { foreignKey: 'created_by', as: 'creator' });

// ── Module ↔ CompanyModule / CompanyModuleRequest ─────────────────
Module.hasMany(CompanyModule,          { foreignKey: 'module_id', as: 'companyModules' });
CompanyModule.belongsTo(Module,        { foreignKey: 'module_id', as: 'module' });

Module.hasMany(CompanyModuleRequest,   { foreignKey: 'module_id', as: 'requests' });
CompanyModuleRequest.belongsTo(Module, { foreignKey: 'module_id', as: 'module' });

// ── CompanyModuleRequest: requester / reviewer ────────────────────
User.hasMany(CompanyModuleRequest,   { foreignKey: 'requested_by', as: 'requestedModules' });
CompanyModuleRequest.belongsTo(User, { foreignKey: 'requested_by', as: 'requester' });
CompanyModuleRequest.belongsTo(User, { foreignKey: 'reviewed_by',  as: 'reviewer'  });

// ── CompanyModule: approved_by ────────────────────────────────────
User.hasMany(CompanyModule,   { foreignKey: 'approved_by', as: 'approvedModules' });
CompanyModule.belongsTo(User, { foreignKey: 'approved_by', as: 'approvedBy' });

// ── AuditLog ──────────────────────────────────────────────────────
User.hasMany(AuditLog,   { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ── SystemLog ─────────────────────────────────────────────────────
User.hasMany(SystemLog,   { foreignKey: 'user_id', as: 'systemLogs' });
SystemLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  Company, Role, User,
  Module, CompanyModule, CompanyModuleRequest,
  Supplier, StoreCustomer, TaxRate,
  Product, Invoice, InvoiceDetail, InvoicePayment,
  InventoryMovement,
  ExpenseCategory, Expense, ExpensePayment,
  ExpenseBudget, ExpenseRecurring,
  PettyCash, PettyCashMovement,
  AuditLog, SystemLog,
};
