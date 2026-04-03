'use strict';

const Organization       = require('./Organization');
const TaxRate            = require('./TaxRate');
const Permission         = require('./Permission');
const Role               = require('./Role');
const User               = require('./User');
const Client             = require('./Client');
const Supplier           = require('./Supplier');
const Category           = require('./Category');
const Product            = require('./Product');
const SupplierProduct    = require('./SupplierProduct');
const PriceHistory       = require('./PriceHistory');
const InventoryMovement  = require('./InventoryMovement');
const PurchaseOrder      = require('./PurchaseOrder');
const PurchaseOrderDetail = require('./PurchaseOrderDetail');
const Order              = require('./Order');
const OrderDetail        = require('./OrderDetail');
const Invoice            = require('./Invoice');
const InvoiceDetail      = require('./InvoiceDetail');
const CreditNote         = require('./CreditNote');
const CreditNoteDetail   = require('./CreditNoteDetail');
const Payment            = require('./Payment');
const CashRegister       = require('./CashRegister');
const CashRegisterMovement = require('./CashRegisterMovement');
const ExpenseCategory    = require('./ExpenseCategory');
const Expense            = require('./Expense');
const AuditLog           = require('./AuditLog');

// ── TaxRate ────────────────────────────────────────────────────
Organization.belongsTo(TaxRate, { foreignKey: 'default_tax_id', as: 'defaultTax' });
TaxRate.hasMany(Organization,   { foreignKey: 'default_tax_id', as: 'organizations' });
TaxRate.hasMany(Product,        { foreignKey: 'tax_rate_id',    as: 'products' });
Product.belongsTo(TaxRate,      { foreignKey: 'tax_rate_id',    as: 'taxRate' });

// ── RBAC: Role ↔ Permission (many-to-many) ─────────────────────
Role.belongsToMany(Permission, { through: 'role_permissions', foreignKey: 'role_id',      otherKey: 'permission_id', as: 'permissions' });
Permission.belongsToMany(Role, { through: 'role_permissions', foreignKey: 'permission_id', otherKey: 'role_id',       as: 'roles' });

// ── Organization → Roles/Users ─────────────────────────────────
Organization.hasMany(Role, { foreignKey: 'organization_id', as: 'roles' });
Role.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

Role.hasMany(User,  { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// ── Organization → all tenant tables ──────────────────────────
const orgHasMany = (Model, as) =>
  Organization.hasMany(Model, { foreignKey: 'organization_id', as });

orgHasMany(User,               'users');
orgHasMany(Client,             'clients');
orgHasMany(Supplier,           'suppliers');
orgHasMany(Category,           'categories');
orgHasMany(Product,            'products');
orgHasMany(SupplierProduct,    'supplierProducts');
orgHasMany(PriceHistory,       'priceHistories');
orgHasMany(InventoryMovement,  'inventoryMovements');
orgHasMany(PurchaseOrder,      'purchaseOrders');
orgHasMany(Order,              'orders');
orgHasMany(Invoice,            'invoices');
orgHasMany(CreditNote,         'creditNotes');
orgHasMany(Payment,            'payments');
orgHasMany(CashRegister,       'cashRegisters');
orgHasMany(ExpenseCategory,    'expenseCategories');
orgHasMany(Expense,            'expenses');
orgHasMany(AuditLog,           'auditLogs');

const belongsToOrg = (Model) =>
  Model.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

[User, Client, Supplier, Category, Product, SupplierProduct, PriceHistory,
 InventoryMovement, PurchaseOrder, Order, Invoice, CreditNote, Payment,
 CashRegister, ExpenseCategory, Expense, AuditLog].forEach(belongsToOrg);

// ── Categories (self-referencing) ──────────────────────────────
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });
Category.hasMany(Category,   { foreignKey: 'parent_id', as: 'children' });

// ── Product ────────────────────────────────────────────────────
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Category.hasMany(Product,   { foreignKey: 'category_id', as: 'products' });

// ── SupplierProduct ────────────────────────────────────────────
Supplier.hasMany(SupplierProduct, { foreignKey: 'supplier_id', as: 'supplierProducts' });
SupplierProduct.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Product.hasMany(SupplierProduct,  { foreignKey: 'product_id',  as: 'supplierProducts' });
SupplierProduct.belongsTo(Product, { foreignKey: 'product_id',  as: 'product' });

// ── PriceHistory ───────────────────────────────────────────────
Product.hasMany(PriceHistory,   { foreignKey: 'product_id', as: 'priceHistories' });
PriceHistory.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
User.hasMany(PriceHistory,      { foreignKey: 'changed_by',  as: 'priceChanges' });
PriceHistory.belongsTo(User,    { foreignKey: 'changed_by',  as: 'changedBy' });

// ── InventoryMovement ──────────────────────────────────────────
Product.hasMany(InventoryMovement,   { foreignKey: 'product_id', as: 'movements' });
InventoryMovement.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
User.hasMany(InventoryMovement,      { foreignKey: 'user_id',    as: 'inventoryMovements' });
InventoryMovement.belongsTo(User,    { foreignKey: 'user_id',    as: 'user' });

// ── PurchaseOrder ──────────────────────────────────────────────
Supplier.hasMany(PurchaseOrder,    { foreignKey: 'supplier_id', as: 'purchaseOrders' });
PurchaseOrder.belongsTo(Supplier,  { foreignKey: 'supplier_id', as: 'supplier' });
User.hasMany(PurchaseOrder,        { foreignKey: 'user_id',     as: 'purchaseOrders' });
PurchaseOrder.belongsTo(User,      { foreignKey: 'user_id',     as: 'user' });

PurchaseOrder.hasMany(PurchaseOrderDetail,   { foreignKey: 'purchase_order_id', as: 'details' });
PurchaseOrderDetail.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id', as: 'purchaseOrder' });
Product.hasMany(PurchaseOrderDetail,         { foreignKey: 'product_id',        as: 'purchaseOrderDetails' });
PurchaseOrderDetail.belongsTo(Product,       { foreignKey: 'product_id',        as: 'product' });

// ── Order ──────────────────────────────────────────────────────
Client.hasMany(Order,  { foreignKey: 'client_id', as: 'orders' });
Order.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });
User.hasMany(Order,    { foreignKey: 'user_id',   as: 'orders' });
Order.belongsTo(User,  { foreignKey: 'user_id',   as: 'user' });

Order.hasMany(OrderDetail,   { foreignKey: 'order_id', as: 'details' });
OrderDetail.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
Product.hasMany(OrderDetail,    { foreignKey: 'product_id', as: 'orderDetails' });
OrderDetail.belongsTo(Product,  { foreignKey: 'product_id', as: 'product' });

// ── Invoice ────────────────────────────────────────────────────
Order.hasMany(Invoice,    { foreignKey: 'order_id',  as: 'invoices' });
Invoice.belongsTo(Order,  { foreignKey: 'order_id',  as: 'order' });
Client.hasMany(Invoice,   { foreignKey: 'client_id', as: 'invoices' });
Invoice.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });
User.hasMany(Invoice,     { foreignKey: 'user_id',   as: 'invoices' });
Invoice.belongsTo(User,   { foreignKey: 'user_id',   as: 'user' });

Invoice.hasMany(InvoiceDetail,   { foreignKey: 'invoice_id', as: 'details' });
InvoiceDetail.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });
Product.hasMany(InvoiceDetail,   { foreignKey: 'product_id', as: 'invoiceDetails' });
InvoiceDetail.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// ── CreditNote ─────────────────────────────────────────────────
Invoice.hasMany(CreditNote,     { foreignKey: 'invoice_id', as: 'creditNotes' });
CreditNote.belongsTo(Invoice,   { foreignKey: 'invoice_id', as: 'invoice' });
User.hasMany(CreditNote,        { foreignKey: 'user_id',    as: 'creditNotes' });
CreditNote.belongsTo(User,      { foreignKey: 'user_id',    as: 'user' });

CreditNote.hasMany(CreditNoteDetail,   { foreignKey: 'credit_note_id', as: 'details' });
CreditNoteDetail.belongsTo(CreditNote, { foreignKey: 'credit_note_id', as: 'creditNote' });
Product.hasMany(CreditNoteDetail,      { foreignKey: 'product_id',     as: 'creditNoteDetails' });
CreditNoteDetail.belongsTo(Product,    { foreignKey: 'product_id',     as: 'product' });

// ── Payment ────────────────────────────────────────────────────
Invoice.hasMany(Payment,   { foreignKey: 'invoice_id', as: 'payments' });
Payment.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });
User.hasMany(Payment,      { foreignKey: 'user_id',    as: 'payments' });
Payment.belongsTo(User,    { foreignKey: 'user_id',    as: 'user' });

// ── CashRegister ───────────────────────────────────────────────
User.hasMany(CashRegister,       { foreignKey: 'user_id', as: 'cashRegisters' });
CashRegister.belongsTo(User,     { foreignKey: 'user_id', as: 'user' });

CashRegister.hasMany(CashRegisterMovement,   { foreignKey: 'cash_register_id', as: 'movements' });
CashRegisterMovement.belongsTo(CashRegister, { foreignKey: 'cash_register_id', as: 'cashRegister' });
Payment.hasMany(CashRegisterMovement,        { foreignKey: 'payment_id',       as: 'cashMovements' });
CashRegisterMovement.belongsTo(Payment,      { foreignKey: 'payment_id',       as: 'payment' });

// ── Expense ────────────────────────────────────────────────────
ExpenseCategory.hasMany(Expense,     { foreignKey: 'category_id',  as: 'expenses' });
Expense.belongsTo(ExpenseCategory,   { foreignKey: 'category_id',  as: 'category' });
User.hasMany(Expense,                { foreignKey: 'user_id',       as: 'expenses' });
Expense.belongsTo(User,              { foreignKey: 'user_id',       as: 'user' });
Supplier.hasMany(Expense,            { foreignKey: 'supplier_id',   as: 'expenses' });
Expense.belongsTo(Supplier,          { foreignKey: 'supplier_id',   as: 'supplier' });

// ── AuditLog ───────────────────────────────────────────────────
User.hasMany(AuditLog,   { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  Organization, TaxRate, Permission, Role, User,
  Client, Supplier, Category, Product, SupplierProduct, PriceHistory,
  InventoryMovement, PurchaseOrder, PurchaseOrderDetail,
  Order, OrderDetail,
  Invoice, InvoiceDetail, CreditNote, CreditNoteDetail,
  Payment, CashRegister, CashRegisterMovement,
  ExpenseCategory, Expense,
  AuditLog,
};
