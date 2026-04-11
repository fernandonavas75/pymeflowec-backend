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
const InventoryMovement    = require('./InventoryMovement');
const AuditLog             = require('./AuditLog');
const SystemLog            = require('./SystemLog');

// ── Role (catálogo global) ↔ User ────────────────────────────────
Role.hasMany(User,   { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// ── Company ↔ User ───────────────────────────────────────────────
Company.hasMany(User,   { foreignKey: 'company_id', as: 'users' });
User.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

// ── Company ↔ tenant tables ──────────────────────────────────────
const companyHasMany = (Model, as) =>
  Company.hasMany(Model, { foreignKey: 'company_id', as });

companyHasMany(Supplier,          'suppliers');
companyHasMany(StoreCustomer,     'customers');
companyHasMany(TaxRate,           'taxRates');
companyHasMany(Product,           'products');
companyHasMany(Invoice,           'invoices');
companyHasMany(InventoryMovement, 'inventoryMovements');
companyHasMany(AuditLog,          'auditLogs');
companyHasMany(SystemLog,         'systemLogs');
companyHasMany(CompanyModule,     'companyModules');
companyHasMany(CompanyModuleRequest, 'moduleRequests');

const belongsToCompany = (Model) =>
  Model.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

[Supplier, StoreCustomer, TaxRate, Product, Invoice,
 InventoryMovement, AuditLog, SystemLog,
 CompanyModule, CompanyModuleRequest].forEach(belongsToCompany);

// ── Supplier ↔ Product ───────────────────────────────────────────
Supplier.hasMany(Product,   { foreignKey: 'supplier_id', as: 'products' });
Product.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

// ── TaxRate ↔ Product ────────────────────────────────────────────
TaxRate.hasMany(Product,    { foreignKey: 'tax_rate_id', as: 'products' });
Product.belongsTo(TaxRate,  { foreignKey: 'tax_rate_id', as: 'taxRate' });

// ── Invoice ──────────────────────────────────────────────────────
StoreCustomer.hasMany(Invoice,   { foreignKey: 'customer_id', as: 'invoices' });
Invoice.belongsTo(StoreCustomer, { foreignKey: 'customer_id', as: 'customer' });

User.hasMany(Invoice,    { foreignKey: 'created_by', as: 'invoices' });
Invoice.belongsTo(User,  { foreignKey: 'created_by', as: 'createdBy' });

// ── InvoiceDetail ────────────────────────────────────────────────
Invoice.hasMany(InvoiceDetail,    { foreignKey: 'invoice_id', as: 'details' });
InvoiceDetail.belongsTo(Invoice,  { foreignKey: 'invoice_id', as: 'invoice' });

Product.hasMany(InvoiceDetail,    { foreignKey: 'product_id', as: 'invoiceDetails' });
InvoiceDetail.belongsTo(Product,  { foreignKey: 'product_id', as: 'product' });

TaxRate.hasMany(InvoiceDetail,    { foreignKey: 'tax_rate_id', as: 'invoiceDetails' });
InvoiceDetail.belongsTo(TaxRate,  { foreignKey: 'tax_rate_id', as: 'taxRate' });

Company.hasMany(InvoiceDetail,    { foreignKey: 'company_id', as: 'invoiceDetails' });
InvoiceDetail.belongsTo(Company,  { foreignKey: 'company_id', as: 'company' });

// ── InventoryMovement ────────────────────────────────────────────
Product.hasMany(InventoryMovement,   { foreignKey: 'product_id', as: 'movements' });
InventoryMovement.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

User.hasMany(InventoryMovement,      { foreignKey: 'created_by', as: 'inventoryMovements' });
InventoryMovement.belongsTo(User,    { foreignKey: 'created_by', as: 'createdBy' });

// ── Module ↔ CompanyModule / CompanyModuleRequest ─────────────────
Module.hasMany(CompanyModule,        { foreignKey: 'module_id', as: 'companyModules' });
CompanyModule.belongsTo(Module,      { foreignKey: 'module_id', as: 'module' });

Module.hasMany(CompanyModuleRequest, { foreignKey: 'module_id', as: 'requests' });
CompanyModuleRequest.belongsTo(Module, { foreignKey: 'module_id', as: 'module' });

// ── CompanyModuleRequest: requester / reviewer ────────────────────
User.hasMany(CompanyModuleRequest,         { foreignKey: 'requested_by', as: 'requestedModules' });
CompanyModuleRequest.belongsTo(User,       { foreignKey: 'requested_by', as: 'requester' });
CompanyModuleRequest.belongsTo(User,       { foreignKey: 'reviewed_by',  as: 'reviewer'  });

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
  Product, Invoice, InvoiceDetail,
  InventoryMovement, AuditLog, SystemLog,
};
