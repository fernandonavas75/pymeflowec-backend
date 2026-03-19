'use strict';

const Organization = require('./Organization');
const Role         = require('./Role');
const User         = require('./User');
const Client       = require('./Client');
const Supplier     = require('./Supplier');
const Product      = require('./Product');
const Order        = require('./Order');
const OrderDetail  = require('./OrderDetail');
const Invoice      = require('./Invoice');
const InvoiceDetail = require('./InvoiceDetail');
const AuditLog     = require('./AuditLog');

// ── Organization → muchos ─────────────────────────────────────
Organization.hasMany(User,         { foreignKey: 'organization_id', as: 'users' });
Organization.hasMany(Client,       { foreignKey: 'organization_id', as: 'clients' });
Organization.hasMany(Supplier,     { foreignKey: 'organization_id', as: 'suppliers' });
Organization.hasMany(Product,      { foreignKey: 'organization_id', as: 'products' });
Organization.hasMany(Order,        { foreignKey: 'organization_id', as: 'orders' });
Organization.hasMany(Invoice,      { foreignKey: 'organization_id', as: 'invoices' });
Organization.hasMany(AuditLog,     { foreignKey: 'organization_id', as: 'auditLogs' });

// ── Inversa → belongsTo Organization ─────────────────────────
User.belongsTo(Organization,       { foreignKey: 'organization_id', as: 'organization' });
Client.belongsTo(Organization,     { foreignKey: 'organization_id', as: 'organization' });
Supplier.belongsTo(Organization,   { foreignKey: 'organization_id', as: 'organization' });
Product.belongsTo(Organization,    { foreignKey: 'organization_id', as: 'organization' });
Order.belongsTo(Organization,      { foreignKey: 'organization_id', as: 'organization' });
Invoice.belongsTo(Organization,    { foreignKey: 'organization_id', as: 'organization' });
AuditLog.belongsTo(Organization,   { foreignKey: 'organization_id', as: 'organization' });

// ── Role → Users ──────────────────────────────────────────────
Role.hasMany(User,                 { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role,               { foreignKey: 'role_id', as: 'role' });

// ── Client → Orders ───────────────────────────────────────────
Client.hasMany(Order,              { foreignKey: 'client_id', as: 'orders' });
Order.belongsTo(Client,            { foreignKey: 'client_id', as: 'client' });

// ── User → Orders ─────────────────────────────────────────────
User.hasMany(Order,                { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User,              { foreignKey: 'user_id', as: 'user' });

// ── Order → OrderDetails ──────────────────────────────────────
Order.hasMany(OrderDetail,         { foreignKey: 'order_id', as: 'details' });
OrderDetail.belongsTo(Order,       { foreignKey: 'order_id', as: 'order' });

// ── Product → OrderDetails ────────────────────────────────────
Product.hasMany(OrderDetail,       { foreignKey: 'product_id', as: 'orderDetails' });
OrderDetail.belongsTo(Product,     { foreignKey: 'product_id', as: 'product' });

// ── Order → Invoices ──────────────────────────────────────────
Order.hasMany(Invoice,             { foreignKey: 'order_id', as: 'invoices' });
Invoice.belongsTo(Order,           { foreignKey: 'order_id', as: 'order' });

// ── Invoice → InvoiceDetails ──────────────────────────────────
Invoice.hasMany(InvoiceDetail,     { foreignKey: 'invoice_id', as: 'details' });
InvoiceDetail.belongsTo(Invoice,   { foreignKey: 'invoice_id', as: 'invoice' });

// ── Product → InvoiceDetails ──────────────────────────────────
Product.hasMany(InvoiceDetail,     { foreignKey: 'product_id', as: 'invoiceDetails' });
InvoiceDetail.belongsTo(Product,   { foreignKey: 'product_id', as: 'product' });

// ── User → AuditLogs ──────────────────────────────────────────
User.hasMany(AuditLog,             { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User,           { foreignKey: 'user_id', as: 'user' });

module.exports = {
  Organization,
  Role,
  User,
  Client,
  Supplier,
  Product,
  Order,
  OrderDetail,
  Invoice,
  InvoiceDetail,
  AuditLog,
};