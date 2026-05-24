# Documentación Técnica — PymeFlowEc Backend

> Sistema ERP multi-tenant para PYMEs ecuatorianas  
> Proyecto de tesis — Ingeniería en Sistemas / Computación  
> Autor: Fernando Navas

---

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Estructura de Directorios](#4-estructura-de-directorios)
5. [Capa de Datos — Modelos y Esquema](#5-capa-de-datos--modelos-y-esquema)
6. [Diagrama de Asociaciones](#6-diagrama-de-asociaciones)
7. [Capa de Middlewares](#7-capa-de-middlewares)
8. [Capa de Rutas y Endpoints](#8-capa-de-rutas-y-endpoints)
9. [Capa de Servicios — Lógica de Negocio](#9-capa-de-servicios--lógica-de-negocio)
10. [Capa de Validación](#10-capa-de-validación)
11. [Sistema de Autenticación y Autorización](#11-sistema-de-autenticación-y-autorización)
12. [Sistema Multi-Tenant](#12-sistema-multi-tenant)
13. [Sistema de Módulos](#13-sistema-de-módulos)
14. [Flujos de Negocio Críticos](#14-flujos-de-negocio-críticos)
15. [Trabajos Programados (Cron Jobs)](#15-trabajos-programados-cron-jobs)
16. [Configuración de Infraestructura](#16-configuración-de-infraestructura)
17. [Formato de Respuestas API](#17-formato-de-respuestas-api)
18. [Seguridad](#18-seguridad)
19. [Observabilidad y Auditoría](#19-observabilidad-y-auditoría)
20. [Variables de Entorno](#20-variables-de-entorno)
21. [Despliegue](#21-despliegue)

---

## 1. Descripción General

**PymeFlowEc** es un sistema de planificación de recursos empresariales (ERP) diseñado para PYMEs (Pequeñas y Medianas Empresas) ecuatorianas. Proporciona gestión de facturación electrónica, inventario, finanzas, caja chica y control de egresos bajo un modelo **multi-tenant**, donde múltiples empresas comparten la infraestructura pero mantienen total aislamiento de datos.

### Características Principales

| Módulo | Funcionalidad |
|--------|---------------|
| **Facturación** | Emisión de facturas, registro de cobros parciales/totales, anulación con reversión de stock |
| **Inventario** | Control de stock en tiempo real, movimientos de entrada/salida/ajuste, auditoría de cambios |
| **Proveedores** | Gestión de proveedores con validación de RUC ecuatoriano |
| **Clientes** | Base de datos de clientes con validación de cédula/RUC/consumidor final |
| **Caja Chica** | Sesiones de caja (apertura/cierre), movimientos, reportes de saldo |
| **Egresos** | Registro de gastos, presupuestos por categoría, egresos recurrentes automatizados |
| **Plataforma** | Gestión de empresas, usuarios, módulos habilitados con flujo de aprobación |

---

## 2. Stack Tecnológico

### Runtime y Framework

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Runtime | Node.js | ≥18 LTS |
| Framework HTTP | Express | 4.18.3 |
| ORM | Sequelize | 6.37.8 |
| Base de Datos | PostgreSQL | 14+ |
| Cache / Rate-limit store | Redis (ioredis) | 5.10.1 |

### Dependencias Clave

| Paquete | Propósito |
|---------|-----------|
| `jsonwebtoken 9.0.3` | Generación y verificación de tokens JWT (HS256) |
| `bcryptjs 3.0.3` | Hashing de contraseñas (cost factor 10) |
| `express-validator 7.3.1` | Validación y sanitización de inputs HTTP |
| `helmet 8.1.0` | Cabeceras de seguridad HTTP (CSP, HSTS, X-Frame, etc.) |
| `cors 2.8.6` | Control de Cross-Origin Resource Sharing |
| `express-rate-limit 8.3.1` | Rate limiting por IP o usuario |
| `rate-limit-redis 4.3.1` | Store Redis para rate limiting distribuido |
| `compression 1.8.1` | Compresión gzip de respuestas HTTP |
| `node-cron 4.2.1` | Planificación de tareas periódicas (cron jobs) |
| `nodemailer 8.0.2` | Envío de correos transaccionales (SMTP) |
| `winston 3.19.0` | Logging estructurado (console + archivo rotativo) |
| `swagger-jsdoc 6.2.8` + `swagger-ui-express 4.6.3` | Documentación OpenAPI 3.0 interactiva |
| `uuid 13.0.0` | Generación de identificadores únicos |

---

## 3. Arquitectura del Sistema

### Patrón Arquitectónico

El backend implementa una arquitectura en capas siguiendo el patrón **MVC extendido** con separación de responsabilidades:

```
Cliente HTTP
     │
     ▼
┌─────────────────────────────────────────┐
│             Express App (app.js)         │
│  Helmet · CORS · Compression · Logger   │
│  Rate Limiter · Swagger UI · 404 · 500  │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│            Capa de Rutas                │
│  authenticate → authorize →             │
│  checkModuleExpiry → validate →         │
│  Controller Handler                     │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│           Capa de Servicios             │
│  Lógica de negocio pura                │
│  Sin acceso directo a req/res           │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│           Capa de Modelos               │
│  Sequelize ORM ↔ PostgreSQL            │
│  Schema: erp | Timezone: UTC-5 (GYE)   │
└─────────────────────────────────────────┘
```

### Servidor de Entrada

**Archivo:** `server.js`

```
Puerto: process.env.PORT || 3000
Inicialización:
  1. Conectar Sequelize a PostgreSQL
  2. Iniciar cron job: expireModules (0 0 * * *)
  3. Iniciar cron job: recurringExpenses (0 11 * * * UTC)
  4. Escuchar en puerto configurado
```

### Stack de Middleware (en orden de ejecución)

```
1. helmet()                    → Cabeceras de seguridad HTTP
2. cors(options)               → CORS: origen FRONTEND_URL, métodos GET/POST/PUT/PATCH/DELETE
3. compression()               → Gzip de respuestas
4. express.json()              → Parsing de body JSON
5. express.urlencoded()        → Parsing form-urlencoded
6. httpLogger (custom)         → Logs Winston por request/response (nivel por código HTTP)
7. globalRateLimiter           → 300 req / 15 min (Redis o in-memory)
8. swagger-ui-express          → GET /api-docs
9. /api/* routes               → Rutas de negocio
10. 404 handler                → Rutas no encontradas
11. errorHandler               → Manejo global de errores (incluye Sequelize errors)
```

---

## 4. Estructura de Directorios

```
pymeflowec-backend/
├── server.js                        ← Punto de entrada: inicia servidor + cron jobs
├── src/
│   ├── app.js                       ← Express app: middleware stack + rutas
│   ├── config/
│   │   ├── database.js              ← Instancia Sequelize + pool + SSL condicional
│   │   └── redis.js                 ← Cliente ioredis opcional (fallback in-memory)
│   │
│   ├── models/                      ← 24 modelos Sequelize (schema: erp)
│   │   ├── index.js                 ← Registro de todas las asociaciones
│   │   ├── Role.js
│   │   ├── Company.js
│   │   ├── User.js
│   │   ├── Module.js
│   │   ├── CompanyModule.js
│   │   ├── CompanyModuleRequest.js
│   │   ├── StoreCustomer.js
│   │   ├── Supplier.js
│   │   ├── Product.js
│   │   ├── TaxRate.js
│   │   ├── Invoice.js
│   │   ├── InvoiceDetail.js
│   │   ├── InvoicePayment.js
│   │   ├── InventoryMovement.js
│   │   ├── PettyCash.js
│   │   ├── PettyCashMovement.js
│   │   ├── Expense.js
│   │   ├── ExpenseCategory.js
│   │   ├── ExpensePayment.js
│   │   ├── ExpenseBudget.js
│   │   ├── ExpenseRecurring.js
│   │   ├── AuditLog.js
│   │   └── SystemLog.js
│   │
│   ├── controllers/                 ← 21 controllers: manejo HTTP, delegan a services
│   ├── services/                    ← 21 services: lógica de negocio pura
│   ├── routes/                      ← 21 archivos de rutas + validators anidados
│   ├── validators/                  ← 14 archivos de reglas express-validator
│   ├── middlewares/                 ← 7 middlewares reutilizables
│   ├── jobs/
│   │   ├── expireModules.job.js     ← Cron: desactiva módulos vencidos (diario 00:00)
│   │   └── recurringExpenses.job.js ← Cron: genera egresos desde plantillas (06:00 GYE)
│   └── utils/
│       ├── logger.js                ← Winston: console + rotativo 10MB/archivo
│       ├── mailer.js                ← Nodemailer SMTP transporter
│       └── ecuadorId.js             ← Validación cédula (mod-10) y RUC (mod-11)
│
├── logs/                            ← Archivos de log (gitignored)
├── package.json
├── .env.example
└── CLAUDE.md
```

---

## 5. Capa de Datos — Modelos y Esquema

Todos los modelos usan el esquema PostgreSQL `erp`. Las convenciones globales de Sequelize son:
- `underscored: true` → nombres de columna en `snake_case`
- `timestamps: true` → columnas `created_at`, `updated_at` automáticas
- `paranoid: true` (donde aplique) → soft-delete con columna `deleted_at`

### 5.1 Modelos del Sistema

#### `roles` — Catálogo de Roles

| Columna | Tipo SQL | Restricciones |
|---------|----------|---------------|
| id | BIGINT | PK, autoincrement |
| name | VARCHAR(50) | NOT NULL, UNIQUE |
| scope | ENUM | `PLATFORM` \| `STORE` |
| description | TEXT | nullable |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

**Valores del catálogo:**

| Nombre | Scope | Descripción |
|--------|-------|-------------|
| `PLATFORM_ADMIN` | PLATFORM | Administrador de la plataforma SaaS |
| `PLATFORM_STAFF` | PLATFORM | Soporte técnico (solo lectura) |
| `STORE_ADMIN` | STORE | Administrador de empresa/tienda |
| `STORE_SELLER` | STORE | Vendedor: facturas y cobros |
| `STORE_WAREHOUSE` | STORE | Bodeguero: ajustes de stock |

---

#### `companies` — Empresas (Tenants)

| Columna | Tipo SQL | Restricciones |
|---------|----------|---------------|
| id | BIGINT | PK, autoincrement |
| name | VARCHAR(150) | NOT NULL |
| business_name | VARCHAR(200) | nullable |
| ruc | VARCHAR(13) | NOT NULL, UNIQUE |
| email | VARCHAR(150) | NOT NULL |
| phone | VARCHAR(20) | nullable |
| address | TEXT | nullable |
| invoice_settings | JSONB | estructura: `{establishment, emission_point, sequential_number, ...}` |
| status | ENUM | `ACTIVE` \| `INACTIVE` \| `SUSPENDED` \| `PENDING` |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |
| deleted_at | TIMESTAMP | nullable (soft-delete) |

**Estructura `invoice_settings` (JSONB):**
```json
{
  "establishment": "001",
  "emission_point": "001",
  "sequential_number": 1,
  "prefix_format": "001-001-{sequential}"
}
```

---

#### `users` — Usuarios

| Columna | Tipo SQL | Restricciones |
|---------|----------|---------------|
| id | BIGINT | PK, autoincrement |
| company_id | BIGINT | FK → companies.id, nullable (NULL = usuario de plataforma) |
| role_id | BIGINT | FK → roles.id, NOT NULL |
| full_name | VARCHAR(150) | NOT NULL |
| email | VARCHAR(150) | NOT NULL, UNIQUE |
| password_hash | VARCHAR(255) | NOT NULL |
| reset_token | VARCHAR(255) | nullable |
| reset_token_expires | TIMESTAMP | nullable |
| status | ENUM | `ACTIVE` \| `INACTIVE` \| `LOCKED` |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |
| deleted_at | TIMESTAMP | nullable (soft-delete) |

---

#### `modules` — Catálogo de Módulos

| Columna | Tipo SQL | Restricciones |
|---------|----------|---------------|
| id | BIGINT | PK, autoincrement |
| code | VARCHAR(50) | NOT NULL, UNIQUE |
| name | VARCHAR(100) | NOT NULL |
| description | TEXT | nullable |
| is_active | BOOLEAN | NOT NULL, default true |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

**Módulos del sistema:**

| Código | Descripción |
|--------|-------------|
| `MOD_INVOICING` | Facturación y gestión de clientes |
| `MOD_SUPPLIERS` | Gestión de proveedores |
| `MOD_PRODUCTS` | Catálogo de productos |
| `MOD_INVENTORY` | Movimientos de inventario |
| `MOD_TAX` | Tasas de impuesto |
| `MOD_PAYMENTS` | Pagos de facturas |
| `MOD_FINANCE` | Finanzas: caja chica y egresos |

---

#### `company_modules` — Módulos Activos por Empresa

| Columna | Tipo SQL | Restricciones |
|---------|----------|---------------|
| id | BIGINT | PK, autoincrement |
| company_id | BIGINT | FK → companies.id, NOT NULL |
| module_id | BIGINT | FK → modules.id, NOT NULL |
| is_active | BOOLEAN | NOT NULL |
| approved_by | BIGINT | FK → users.id, nullable |
| approved_at | TIMESTAMP | nullable |
| expires_at | TIMESTAMP | nullable |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

---

#### `company_module_requests` — Solicitudes de Módulo

| Columna | Tipo SQL | Restricciones |
|---------|----------|---------------|
| id | BIGINT | PK, autoincrement |
| company_id | BIGINT | FK → companies.id |
| module_id | BIGINT | FK → modules.id |
| requested_by | BIGINT | FK → users.id |
| status | ENUM | `PENDING` \| `APPROVED` \| `REJECTED` \| `REVOKED` |
| reviewed_by | BIGINT | FK → users.id, nullable |
| reviewed_at | TIMESTAMP | nullable |
| comments | TEXT | nullable |
| expires_at | TIMESTAMP | nullable |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

---

### 5.2 Modelos Maestros

#### `store_customers` — Clientes de Tienda

| Columna | Tipo SQL | Restricciones |
|---------|----------|---------------|
| id | BIGINT | PK |
| company_id | BIGINT | FK → companies.id |
| customer_type | ENUM | `CEDULA` \| `RUC` \| `FINAL_CONSUMER` |
| document_number | VARCHAR(13) | NOT NULL |
| full_name | VARCHAR(150) | NOT NULL |
| email | VARCHAR(150) | nullable |
| phone | VARCHAR(20) | nullable |
| address | TEXT | nullable |
| created_at / updated_at | TIMESTAMP | NOT NULL |
| deleted_at | TIMESTAMP | soft-delete |

> **Regla de negocio:** `FINAL_CONSUMER` usa `document_number = '9999999999999'` por convención del SRI ecuatoriano.

---

#### `suppliers` — Proveedores

| Columna | Tipo SQL | Restricciones |
|---------|----------|---------------|
| id | BIGINT | PK |
| company_id | BIGINT | FK → companies.id |
| name | VARCHAR(150) | NOT NULL |
| ruc | VARCHAR(13) | NOT NULL |
| phone | VARCHAR(20) | nullable |
| email | VARCHAR(150) | nullable |
| address | TEXT | nullable |
| created_at / updated_at | TIMESTAMP | NOT NULL |
| deleted_at | TIMESTAMP | soft-delete |

---

#### `tax_rates` — Tasas de Impuesto

| Columna | Tipo SQL | Restricciones |
|---------|----------|---------------|
| id | BIGINT | PK |
| company_id | BIGINT | FK → companies.id |
| tax_name | VARCHAR(100) | NOT NULL |
| percentage | DECIMAL(5,2) | NOT NULL (ej: 15.00 para IVA Ecuador) |
| is_active | BOOLEAN | NOT NULL, default true |
| valid_from | DATE | nullable |
| valid_to | DATE | nullable |
| created_at / updated_at | TIMESTAMP | NOT NULL |

> **Nota:** El IVA vigente en Ecuador es del **15%**.

---

#### `products` — Productos

| Columna | Tipo SQL | Restricciones |
|---------|----------|---------------|
| id | BIGINT | PK |
| company_id | BIGINT | FK → companies.id |
| supplier_id | BIGINT | FK → suppliers.id, nullable |
| tax_rate_id | BIGINT | FK → tax_rates.id |
| sku | VARCHAR(50) | NOT NULL |
| name | VARCHAR(150) | NOT NULL |
| description | TEXT | nullable |
| purchase_price | DECIMAL(12,2) | NOT NULL |
| sale_price | DECIMAL(12,2) | NOT NULL |
| stock | INTEGER | NOT NULL, default 0 |
| min_stock | INTEGER | NOT NULL, default 0 |
| status | ENUM | `ACTIVE` \| `INACTIVE` |
| created_at / updated_at | TIMESTAMP | NOT NULL |
| deleted_at | TIMESTAMP | soft-delete |

---

### 5.3 Modelos de Facturación

#### `invoices` — Facturas

| Columna | Tipo SQL | Restricciones |
|---------|----------|---------------|
| id | BIGINT | PK |
| company_id | BIGINT | FK → companies.id |
| customer_id | BIGINT | FK → store_customers.id |
| created_by | BIGINT | FK → users.id |
| invoice_number | VARCHAR(20) | NOT NULL, UNIQUE por empresa |
| issue_date | DATE | NOT NULL |
| subtotal | DECIMAL(12,2) | NOT NULL |
| tax_amount | DECIMAL(12,2) | NOT NULL |
| total | DECIMAL(12,2) | NOT NULL |
| status | ENUM | `ISSUED` \| `CANCELLED` |
| payment_status | ENUM | `PENDIENTE` \| `PARCIAL` \| `COBRADO` \| `ANULADO` |
| created_at / updated_at | TIMESTAMP | NOT NULL |
| deleted_at | TIMESTAMP | soft-delete |

---

#### `invoice_details` — Líneas de Factura

| Columna | Tipo SQL | Restricciones |
|---------|----------|---------------|
| id | BIGINT | PK |
| invoice_id | BIGINT | FK → invoices.id |
| company_id | BIGINT | FK → companies.id |
| product_id | BIGINT | FK → products.id, nullable |
| tax_rate_id | BIGINT | FK → tax_rates.id |
| product_name | VARCHAR(150) | NOT NULL (snapshot al momento de venta) |
| description | TEXT | nullable |
| quantity | INTEGER | NOT NULL |
| unit_price | DECIMAL(12,2) | NOT NULL |
| discount | DECIMAL(5,2) | NOT NULL, default 0.00 |
| tax_percentage | DECIMAL(5,2) | NOT NULL |
| tax_amount | DECIMAL(12,2) | NOT NULL |
| line_subtotal | DECIMAL(12,2) | NOT NULL |
| line_total | DECIMAL(12,2) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL (sin updatedAt) |

**Fórmula de cálculo por línea:**
```
line_subtotal = quantity × unit_price × (1 - discount/100)
tax_amount    = line_subtotal × (tax_percentage/100)
line_total    = line_subtotal + tax_amount
```

---

#### `invoice_payments` — Cobros de Factura

| Columna | Tipo SQL | Restricciones |
|---------|----------|---------------|
| id | BIGINT | PK |
| invoice_id | BIGINT | FK → invoices.id |
| company_id | BIGINT | FK → companies.id |
| payment_date | DATE | NOT NULL |
| amount | DECIMAL(12,2) | NOT NULL |
| payment_method | ENUM | `EFECTIVO` \| `TRANSFERENCIA` \| `TARJETA_DEBITO` \| `TARJETA_CREDITO` \| `CHEQUE` \| `OTRO` |
| transfer_reference | VARCHAR(100) | nullable |
| card_contrapartida | VARCHAR(100) | nullable |
| cheque_number | VARCHAR(50) | nullable |
| installment_number | INTEGER | nullable |
| installment_total | INTEGER | nullable |
| due_date | DATE | nullable |
| status | ENUM | `PENDIENTE` \| `PAGADO` \| `VENCIDO` \| `ANULADO` |
| notes | TEXT | nullable |
| created_by | BIGINT | FK → users.id |
| created_at | TIMESTAMP | NOT NULL |

---

#### `inventory_movements` — Movimientos de Inventario

| Columna | Tipo SQL | Restricciones |
|---------|----------|---------------|
| id | BIGINT | PK |
| company_id | BIGINT | FK → companies.id |
| product_id | BIGINT | FK → products.id |
| movement_type | ENUM | `IN` \| `OUT` \| `ADJUSTMENT` |
| quantity | INTEGER | NOT NULL |
| reference_type | ENUM | `PURCHASE` \| `SALE` \| `MANUAL` |
| reference_id | BIGINT | nullable (ID de factura/orden referenciada) |
| notes | TEXT | nullable |
| created_by | BIGINT | FK → users.id |
| created_at | TIMESTAMP | NOT NULL (append-only, sin updatedAt) |

> **Regla de negocio:** El tipo `ADJUSTMENT` está restringido al rol `STORE_ADMIN`. `STORE_WAREHOUSE` solo puede realizar `IN` y `OUT`.

---

### 5.4 Modelos de Finanzas

#### `petty_cash` — Caja Chica (Sesiones)

| Columna | Tipo SQL | Restricciones |
|---------|----------|---------------|
| id | BIGINT | PK |
| company_id | BIGINT | FK → companies.id |
| name | VARCHAR(100) | NOT NULL |
| opening_amount | DECIMAL(12,2) | NOT NULL |
| current_balance | DECIMAL(12,2) | NOT NULL |
| status | ENUM | `OPEN` \| `CLOSED` |
| opened_by | BIGINT | FK → users.id |
| opened_at | TIMESTAMP | NOT NULL |
| closed_by | BIGINT | FK → users.id, nullable |
| closed_at | TIMESTAMP | nullable |
| closing_amount_reported | DECIMAL(12,2) | nullable |
| notes | TEXT | nullable |
| created_at / updated_at | TIMESTAMP | NOT NULL |

---

#### `petty_cash_movements` — Movimientos de Caja Chica

| Columna | Tipo SQL | Restricciones |
|---------|----------|---------------|
| id | BIGINT | PK |
| petty_cash_id | BIGINT | FK → petty_cash.id |
| company_id | BIGINT | FK → companies.id |
| movement_type | ENUM | `EXPENSE` \| `REPLENISH` \| `ADJUSTMENT` |
| category_id | BIGINT | FK → expense_categories.id, nullable |
| amount | DECIMAL(12,2) | NOT NULL |
| description | TEXT | NOT NULL |
| voucher_number | VARCHAR(50) | nullable |
| balance_after | DECIMAL(12,2) | NOT NULL |
| created_by | BIGINT | FK → users.id |
| created_at | TIMESTAMP | NOT NULL (append-only) |

---

#### `expense_categories` — Categorías de Egreso

| Columna | Tipo SQL | Restricciones |
|---------|----------|---------------|
| id | BIGINT | PK |
| company_id | BIGINT | FK → companies.id |
| name | VARCHAR(100) | NOT NULL |
| category_type | ENUM | `ADMINISTRATIVO` \| `OPERATIVO` \| `VENTAS` \| `FINANCIERO` \| `TRIBUTARIO` \| `RECURSOS_HUMANOS` \| `INVENTARIO` \| `IMPREVISTO` |
| description | TEXT | nullable |
| is_active | BOOLEAN | NOT NULL, default true |
| created_at / updated_at | TIMESTAMP | NOT NULL |
| deleted_at | TIMESTAMP | soft-delete |

---

#### `expenses` — Egresos

| Columna | Tipo SQL | Restricciones |
|---------|----------|---------------|
| id | BIGINT | PK |
| company_id | BIGINT | FK → companies.id |
| category_id | BIGINT | FK → expense_categories.id |
| supplier_id | BIGINT | FK → suppliers.id, nullable |
| supplier_name_free | VARCHAR(200) | nullable (proveedor libre sin FK) |
| description | TEXT | NOT NULL |
| expense_date | DATE | NOT NULL |
| amount | DECIMAL(12,2) | NOT NULL |
| voucher_number | VARCHAR(50) | nullable |
| voucher_type | VARCHAR(50) | nullable |
| payment_status | ENUM | `PENDIENTE` \| `PARCIAL` \| `PAGADO` \| `ANULADO` |
| notes | TEXT | nullable |
| created_by | BIGINT | FK → users.id |
| created_at / updated_at | TIMESTAMP | NOT NULL |
| deleted_at | TIMESTAMP | soft-delete |

---

#### `expense_payments` — Pagos de Egreso

| Columna | Tipo SQL | Similitud |
|---------|----------|-----------|
| Estructura | Similar a `invoice_payments` | Referencia a `expense_id` en lugar de `invoice_id` |
| Métodos de pago | 6 métodos idénticos | EFECTIVO, TRANSFERENCIA, TARJETA_DEBITO, TARJETA_CREDITO, CHEQUE, OTRO |
| Status | ENUM | `PENDIENTE` \| `PAGADO` \| `VENCIDO` \| `ANULADO` |

---

#### `expense_budgets` — Presupuestos de Egreso

| Columna | Tipo SQL | Restricciones |
|---------|----------|---------------|
| id | BIGINT | PK |
| company_id | BIGINT | FK → companies.id |
| category_id | BIGINT | FK → expense_categories.id |
| period_type | ENUM | `MONTHLY` \| `ANNUAL` |
| period_year | INTEGER | NOT NULL |
| period_month | INTEGER | nullable (solo si MONTHLY) |
| budgeted_amount | DECIMAL(12,2) | NOT NULL |
| notes | TEXT | nullable |
| created_by | BIGINT | FK → users.id |
| created_at / updated_at | TIMESTAMP | NOT NULL |

---

#### `expense_recurring` — Egresos Recurrentes (Plantillas)

| Columna | Tipo SQL | Restricciones |
|---------|----------|---------------|
| id | BIGINT | PK |
| company_id | BIGINT | FK → companies.id |
| category_id | BIGINT | FK → expense_categories.id |
| supplier_id | BIGINT | FK → suppliers.id, nullable |
| supplier_name_free | VARCHAR(200) | nullable |
| description | TEXT | NOT NULL |
| amount | DECIMAL(12,2) | NOT NULL |
| day_of_month | INTEGER | NOT NULL (1–28) |
| voucher_type | VARCHAR(50) | nullable |
| default_payment_method | VARCHAR(50) | nullable |
| is_active | BOOLEAN | NOT NULL, default true |
| starts_at | DATE | NOT NULL |
| ends_at | DATE | nullable |
| last_generated_at | TIMESTAMP | nullable |
| created_by | BIGINT | FK → users.id |
| created_at / updated_at | TIMESTAMP | NOT NULL |
| deleted_at | TIMESTAMP | soft-delete |

---

### 5.5 Modelos de Auditoría y Logging

#### `audit_logs` — Registro de Auditoría

| Columna | Tipo SQL | Restricciones |
|---------|----------|---------------|
| id | BIGINT | PK |
| company_id | BIGINT | FK → companies.id, nullable |
| user_id | BIGINT | FK → users.id, nullable |
| action | ENUM | `INSERT` \| `UPDATE` \| `DELETE` |
| table_name | VARCHAR(100) | NOT NULL |
| record_id | BIGINT | NOT NULL |
| old_values | JSONB | nullable |
| new_values | JSONB | nullable |
| ip_address | VARCHAR(45) | nullable |
| user_agent | TEXT | nullable |
| created_at | TIMESTAMP | NOT NULL (append-only, sin updatedAt) |

---

#### `system_logs` — Logs del Sistema

| Columna | Tipo SQL | Restricciones |
|---------|----------|---------------|
| id | BIGINT | PK |
| company_id | BIGINT | nullable |
| user_id | BIGINT | nullable |
| level | ENUM | `DEBUG` \| `INFO` \| `WARN` \| `ERROR` \| `FATAL` |
| source | ENUM | `BACKEND` \| `DATABASE` \| `AUTH` \| `API` \| `CRON` |
| message | TEXT | NOT NULL |
| details | JSONB | nullable |
| created_at | TIMESTAMP | NOT NULL (append-only) |

---

## 6. Diagrama de Asociaciones

```
Role ──────────────────────────── hasMany ──► Users

Company ────────────────────────── hasMany ──► Users
        │                          hasMany ──► Suppliers
        │                          hasMany ──► StoreCustomers
        │                          hasMany ──► TaxRates
        │                          hasMany ──► Products
        │                          hasMany ──► Invoices
        │                          hasMany ──► InvoicePayments
        │                          hasMany ──► InventoryMovements
        │                          hasMany ──► PettyCash
        │                          hasMany ──► PettyCashMovements
        │                          hasMany ──► ExpenseCategories
        │                          hasMany ──► Expenses
        │                          hasMany ──► ExpensePayments
        │                          hasMany ──► ExpenseBudgets
        │                          hasMany ──► ExpenseRecurrings
        │                          hasMany ──► CompanyModules
        └──────────────────────── hasMany ──► CompanyModuleRequests

Module ─────────────────────────── hasMany ──► CompanyModules
       └──────────────────────────  hasMany ──► CompanyModuleRequests

Supplier ───────────────────────── hasMany ──► Products
         └──────────────────────── hasMany ──► Expenses / ExpenseRecurrings

TaxRate ────────────────────────── hasMany ──► Products
        └──────────────────────── hasMany ──► InvoiceDetails

StoreCustomer ──────────────────── hasMany ──► Invoices

Invoice ────────────────────────── hasMany ──► InvoiceDetails
        └──────────────────────── hasMany ──► InvoicePayments

Product ────────────────────────── hasMany ──► InvoiceDetails
        └──────────────────────── hasMany ──► InventoryMovements

ExpenseCategory ────────────────── hasMany ──► Expenses
                │                  hasMany ──► ExpenseBudgets
                │                  hasMany ──► ExpenseRecurrings
                └──────────────────hasMany ──► PettyCashMovements

Expense ────────────────────────── hasMany ──► ExpensePayments

PettyCash ──────────────────────── hasMany ──► PettyCashMovements

User ───────────────────────────── hasMany ──► Invoices (created_by)
     │                             hasMany ──► InvoicePayments (created_by)
     │                             hasMany ──► InventoryMovements (created_by)
     │                             hasMany ──► Expenses (created_by)
     │                             hasMany ──► ExpensePayments (created_by)
     │                             hasMany ──► ExpenseBudgets (created_by)
     │                             hasMany ──► ExpenseRecurrings (created_by)
     │                             hasMany ──► PettyCash (opened_by)
     │                             hasMany ──► PettyCashMovements (created_by)
     │                             hasMany ──► AuditLogs
     └──────────────────────────── hasMany ──► SystemLogs
```

---

## 7. Capa de Middlewares

### 7.1 `authenticate.js`

**Propósito:** Verifica el token JWT de cada request autenticada y construye el objeto `req.user`.

**Flujo de ejecución:**
```
1. Extrae header Authorization: Bearer <token>
2. Verifica firma JWT con process.env.JWT_SECRET
3. Carga User.findByPk(payload.id) con include de Role y Company
4. Valida que el usuario esté ACTIVE y no eliminado (soft-delete)
5. Construye req.user = { id, email, role, company_id, company, ... }
6. Ejecuta SET LOCAL app.current_user_id = <id> en PostgreSQL (para triggers de auditoría)
7. Llama next()
```

**Respuestas de error:**
- `401` — Token ausente, inválido o expirado
- `403` — Usuario inactivo o bloqueado

---

### 7.2 `authorize.js`

**Propósito:** Verifica que el usuario autenticado tenga al menos uno de los roles requeridos.

**Uso:**
```javascript
authorize('STORE_ADMIN', 'STORE_SELLER')
// retorna middleware que valida req.user.role.name
```

**Respuesta de error:**
- `403` — Rol insuficiente

---

### 7.3 `platformAuth.js`

**Propósito:** Guardas específicas para usuarios de la plataforma SaaS.

**Exports:**
- `requirePlatform` — Permite cualquier usuario PLATFORM_* 
- `requirePlatformAdmin` — Solo PLATFORM_ADMIN

---

### 7.4 `platformStoreAccess.js`

**Propósito:** Permite acceso híbrido a recursos de tienda. Acepta usuarios STORE con roles especificados, O usuarios PLATFORM que pasen `?company_id=X` en el query (modo cliente).

**Uso:**
```javascript
platformStoreAccess('STORE_ADMIN', 'STORE_SELLER')
// Pasa si: role ∈ {STORE_ADMIN, STORE_SELLER} con su company_id
//          O role ∈ {PLATFORM_*} con company_id en query param
```

---

### 7.5 `checkModuleExpiry.js`

**Propósito:** Verifica que un módulo específico esté activo y vigente para la empresa del usuario.

**Flujo:**
```
1. Busca CompanyModule donde company_id = req.user.company_id AND module.code = moduleCode
2. Si no existe → 403 "Módulo no habilitado"
3. Si is_active = false → 403 "Módulo desactivado"
4. Si expires_at < now():
   a. UPDATE company_modules SET is_active = false  (lazy expiry)
   b. → 403 "Módulo vencido"
5. Si OK → next()
```

**Uso:**
```javascript
checkModuleExpiry('MOD_INVOICING')
```

---

### 7.6 `validate.js`

**Propósito:** Ejecuta una cadena de reglas `express-validator` y retorna 422 si hay errores.

**Uso:**
```javascript
validate(invoiceCreateRules)
// retorna [...rules, handler422]
```

**Respuesta 422:**
```json
{
  "success": false,
  "message": "Datos de entrada inválidos.",
  "errors": [{ "field": "email", "message": "Email inválido." }]
}
```

---

### 7.7 `errorHandler.js`

**Propósito:** Middleware global de manejo de errores (4 argumentos en Express).

**Mapeo de errores Sequelize:**

| Tipo de Error Sequelize | Código HTTP | Respuesta |
|------------------------|-------------|-----------|
| `ValidationError` | 400 | `{ errors: [mensajes] }` |
| `UniqueConstraintError` | 409 | Indica el campo duplicado |
| `ForeignKeyConstraintError` | 400 | "Referencia inválida" |
| `DatabaseError` | 500 | Error genérico |

**Clase `AppError`:**
```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    // statusCode se propaga al handler
  }
}
```

---

## 8. Capa de Rutas y Endpoints

**Prefijo global:** `/api`

### 8.1 Autenticación — `/api/auth`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/login` | Pública | Login con email/password → `{ token, refreshToken, user }` |
| POST | `/register` | Pública | Auto-registro (crea empresa + usuario STORE_ADMIN) |
| POST | `/refresh` | Pública | Renueva access token con refresh token |
| GET | `/me` | JWT | Retorna perfil del usuario autenticado |
| PATCH | `/change-password` | JWT | Cambia contraseña del usuario autenticado |

**Rate limiting especial en `/login`:** 10 solicitudes por 15 minutos por IP.

---

### 8.2 Empresas — `/api/companies`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | Platform | Lista todas las empresas con paginación |
| GET | `/:id` | Platform | Detalle de empresa |
| POST | `/` | PLATFORM_ADMIN | Crea nueva empresa (tenant) |
| PUT | `/:id` | PLATFORM_ADMIN | Actualiza datos de empresa |
| PATCH | `/:id/activate` | PLATFORM_ADMIN | Activa empresa |
| PATCH | `/:id/deactivate` | PLATFORM_ADMIN | Desactiva empresa |
| PATCH | `/:id/suspend` | PLATFORM_ADMIN | Suspende empresa |
| GET | `/my-invoice-settings` | STORE_ADMIN | Configuración de numeración de facturas |
| PUT | `/my-invoice-settings` | STORE_ADMIN | Actualiza configuración de facturación |

---

### 8.3 Usuarios — `/api/users`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | STORE_ADMIN | Lista usuarios de la empresa |
| GET | `/:id` | STORE_ADMIN | Detalle de usuario |
| POST | `/` | STORE_ADMIN | Crea usuario de tienda |
| PUT | `/:id` | STORE_ADMIN | Actualiza usuario |
| PATCH | `/:id/activate` | STORE_ADMIN | Activa usuario |
| PATCH | `/:id/deactivate` | STORE_ADMIN | Desactiva usuario |
| PATCH | `/:id/lock` | STORE_ADMIN | Bloquea usuario |
| PATCH | `/:id/change-password` | STORE_ADMIN | Cambia contraseña de otro usuario |
| DELETE | `/:id` | STORE_ADMIN | Elimina usuario (soft-delete) |
| POST | `/forgot-password` | Pública | Envía email de recuperación |
| POST | `/reset-password` | Pública | Restablece contraseña con token |

---

### 8.4 Clientes — `/api/customers`

| Método | Ruta | Auth | Guard de módulo |
|--------|------|------|----------------|
| GET | `/` | JWT | `MOD_INVOICING` |
| GET | `/:id` | JWT | `MOD_INVOICING` |
| POST | `/` | JWT + STORE_ADMIN/SELLER | `MOD_INVOICING` |
| PUT | `/:id` | JWT + STORE_ADMIN | `MOD_INVOICING` |
| DELETE | `/:id` | JWT + STORE_ADMIN | `MOD_INVOICING` |

---

### 8.5 Proveedores — `/api/suppliers`

| Método | Ruta | Auth | Guard de módulo |
|--------|------|------|----------------|
| GET | `/` | JWT | `MOD_SUPPLIERS` |
| GET | `/:id` | JWT | `MOD_SUPPLIERS` |
| POST | `/` | JWT + STORE_ADMIN | `MOD_SUPPLIERS` |
| PUT | `/:id` | JWT + STORE_ADMIN | `MOD_SUPPLIERS` |
| DELETE | `/:id` | JWT + STORE_ADMIN | `MOD_SUPPLIERS` |

---

### 8.6 Productos — `/api/products`

| Método | Ruta | Auth | Guard de módulo |
|--------|------|------|----------------|
| GET | `/` | JWT | `MOD_PRODUCTS` |
| GET | `/:id` | JWT | `MOD_PRODUCTS` |
| POST | `/` | STORE_ADMIN | `MOD_PRODUCTS` |
| POST | `/bulk` | STORE_ADMIN | `MOD_PRODUCTS` |
| PUT | `/:id` | STORE_ADMIN | `MOD_PRODUCTS` |
| PATCH | `/:id/stock` | STORE_ADMIN / STORE_WAREHOUSE | `MOD_INVENTORY` |
| PATCH | `/:id/activate` | STORE_ADMIN | `MOD_PRODUCTS` |
| PATCH | `/:id/deactivate` | STORE_ADMIN | `MOD_PRODUCTS` |
| DELETE | `/:id` | STORE_ADMIN | `MOD_PRODUCTS` |

---

### 8.7 Tasas de Impuesto — `/api/tax-rates`

| Método | Ruta | Auth | Guard de módulo |
|--------|------|------|----------------|
| GET | `/` | JWT | `MOD_TAX` |
| GET | `/:id` | JWT | `MOD_TAX` |
| POST | `/` | STORE_ADMIN | `MOD_TAX` |
| PUT | `/:id` | STORE_ADMIN | `MOD_TAX` |

---

### 8.8 Facturas — `/api/invoices`

| Método | Ruta | Auth | Guard de módulo |
|--------|------|------|----------------|
| GET | `/` | JWT | `MOD_INVOICING` |
| GET | `/:id` | JWT | `MOD_INVOICING` |
| POST | `/` | STORE_ADMIN / STORE_SELLER | `MOD_INVOICING` |
| PATCH | `/:id/cancel` | STORE_ADMIN | `MOD_INVOICING` |

---

### 8.9 Cobros de Factura — `/api/invoice-payments`

| Método | Ruta | Auth | Guard de módulo |
|--------|------|------|----------------|
| GET | `/` | JWT | `MOD_PAYMENTS` |
| GET | `/:id` | JWT | `MOD_PAYMENTS` |
| POST | `/` | STORE_ADMIN / STORE_SELLER | `MOD_PAYMENTS` |
| DELETE | `/:id` | STORE_ADMIN | `MOD_PAYMENTS` |

---

### 8.10 Movimientos de Inventario — `/api/inventory-movements`

| Método | Ruta | Auth | Guard de módulo |
|--------|------|------|----------------|
| GET | `/` | JWT | `MOD_INVENTORY` |
| GET | `/:id` | JWT | `MOD_INVENTORY` |

> Endpoints de solo lectura. Los movimientos se crean automáticamente por facturas y ajustes de stock.

---

### 8.11 Caja Chica — `/api/petty-cash`

| Método | Ruta | Auth | Guard de módulo |
|--------|------|------|----------------|
| GET | `/` | STORE_ADMIN | `MOD_FINANCE` |
| GET | `/open` | JWT | `MOD_FINANCE` |
| POST | `/open` | STORE_ADMIN | `MOD_FINANCE` |
| PATCH | `/:id/close` | STORE_ADMIN | `MOD_FINANCE` |
| GET | `/:id/movements` | JWT | `MOD_FINANCE` |
| POST | `/:id/movements` | STORE_ADMIN / STORE_SELLER | `MOD_FINANCE` |

---

### 8.12 Egresos y Finanzas — `/api/expenses*`

| Módulo | Base Path | Endpoints disponibles |
|--------|-----------|----------------------|
| Categorías | `/expense-categories` | CRUD completo (GET, POST, PUT, DELETE) |
| Egresos | `/expenses` | GET, POST, PUT, PATCH `/annul` |
| Pagos de egreso | `/expense-payments` | GET, POST, DELETE |
| Presupuestos | `/expense-budgets` | CRUD completo |
| Egresos recurrentes | `/expense-recurring` | GET, POST, PUT, PATCH `/activate`, PATCH `/deactivate`, DELETE |

Todos requieren `authenticate + checkModuleExpiry('MOD_FINANCE')`.

---

### 8.13 Plataforma — `/api/platform` y `/api/module-requests`

| Endpoint | Auth | Descripción |
|----------|------|-------------|
| GET `/platform/users` | PLATFORM | Lista usuarios de plataforma |
| POST `/platform/users` | PLATFORM_ADMIN | Crea usuario de plataforma |
| PATCH `/platform/users/:id/*` | PLATFORM_ADMIN | Activa / desactiva / bloquea |
| GET `/platform/roles` | PLATFORM | Lista roles de plataforma |
| GET `/platform/companies/:id/users` | PLATFORM | Lista usuarios de una empresa |
| GET `/platform/server-logs` | PLATFORM_ADMIN | Últimas 500 líneas del log (tail) |
| GET `/platform/modules` | PLATFORM | Catálogo completo de módulos |
| GET `/platform/modules/public` | Pública | Módulos disponibles públicamente |
| POST `/module-requests` | STORE_ADMIN | Solicita habilitación de módulo |
| GET `/module-requests` | STORE_ADMIN | Lista solicitudes propias |
| GET `/module-requests/all` | PLATFORM | Lista todas las solicitudes |
| PATCH `/module-requests/:id/approve` | PLATFORM_ADMIN | Aprueba solicitud (activa módulo) |
| PATCH `/module-requests/:id/reject` | PLATFORM_ADMIN | Rechaza solicitud |
| PATCH `/module-requests/:id/revoke` | PLATFORM_ADMIN | Revoca acceso a módulo |

---

### 8.14 Auditoría — `/api/audit-logs`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | PLATFORM_ADMIN | Todos los registros (filtro: company_id, action, table_name, fechas) |
| GET | `/my-company` | STORE_ADMIN | Registros de la empresa propia |

**Filtros soportados:** `company_id`, `action`, `table_name`, `date_from`, `date_to`, `search`, `page`, `limit`

---

## 9. Capa de Servicios — Lógica de Negocio

Los servicios no tienen acceso a `req` ni `res`. Reciben parámetros planos y retornan datos o lanzan `AppError`.

### 9.1 `auth.service.js`

| Función | Descripción |
|---------|-------------|
| `login(email, password)` | Verifica credenciales, genera `accessToken` (8h) + `refreshToken` (7d) |
| `register(data)` | Crea Company + User STORE_ADMIN en transacción Sequelize |
| `refresh(refreshToken)` | Verifica refresh token, emite nuevo access token |
| `changePassword(userId, oldPw, newPw)` | Verifica contraseña actual, hashea nueva con bcrypt |

**Generación de tokens:**
```
accessToken  = jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
refreshToken = jwt.sign({ id }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN })
```

---

### 9.2 `invoice.service.js`

El servicio más complejo del sistema. Gestiona el ciclo de vida completo de una factura.

#### `create(data, user)`

```
1. Iniciar transacción Sequelize
2. Extraer IDs únicos de productos e impuestos del array items
3. Cargar todos los productos con findAll({ where: { id: [Op.in]: productIds } })
4. Cargar todas las tasas con findAll({ where: { id: [Op.in]: taxRateIds } })
5. Construir productMap y taxRateMap (acceso O(1) en el loop)
6. Por cada ítem:
   a. Validar que product.company_id = user.company_id
   b. Validar que product.stock >= quantity
   c. Calcular line_subtotal, tax_amount, line_total
   d. Acumular totales de factura
7. Generar número de factura correlativo (UPDATE company.invoice_settings.sequential_number++)
8. CREATE invoice (con totales)
9. BULK CREATE invoice_details
10. Por cada producto: UPDATE product.stock -= quantity
11. BULK CREATE inventory_movements (tipo OUT, reference_type SALE)
12. COMMIT transacción
```

#### `cancel(invoiceId, userId)`

```
1. Verificar que factura existe y status = ISSUED
2. Iniciar transacción
3. UPDATE invoice SET status = CANCELLED, payment_status = ANULADO
4. Por cada invoice_detail: UPDATE product.stock += quantity (reversión)
5. CREATE inventory_movements (tipo IN, reference_type SALE, note = 'Reversión por anulación')
6. COMMIT
```

---

### 9.3 `invoicePayment.service.js`

#### `create(data, user)`

```
1. Verificar que invoice existe y pertenece a la empresa
2. Verificar que invoice.status = ISSUED (no cancelada)
3. CREATE invoice_payment
4. Calcular total cobrado: SUM(invoice_payments.amount donde status = PAGADO)
5. Si total_cobrado >= invoice.total → UPDATE invoice SET payment_status = COBRADO
6. Si 0 < total_cobrado < total → UPDATE invoice SET payment_status = PARCIAL
```

---

### 9.4 `expenseRecurring.service.js` + Cron

El cron job `recurringExpenses.job.js` llama a este servicio diariamente.

**Lógica de generación:**
```
1. Obtener día actual del mes (1-28)
2. Cargar todas las ExpenseRecurring donde:
   - is_active = true
   - day_of_month = hoy
   - (ends_at IS NULL OR ends_at >= hoy)
   - (last_generated_at IS NULL OR last_generated_at < primer_dia_del_mes)
3. Por cada plantilla:
   a. CREATE expense (con datos de la plantilla)
   b. UPDATE expense_recurring SET last_generated_at = now()
   (cada plantilla en transacción independiente para fault-isolation)
```

---

## 10. Capa de Validación

Implementada con `express-validator`. Cada validator exporta arrays de reglas que se pasan al middleware `validate()`.

### Ejemplo — `invoice.validators.js`

```javascript
export const invoiceCreateRules = [
  body('customer_id').isInt().withMessage('Cliente requerido'),
  body('issue_date').isDate().withMessage('Fecha inválida'),
  body('items').isArray({ min: 1 }).withMessage('Se requiere al menos un ítem'),
  body('items.*.product_id').isInt().withMessage('Producto inválido'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Cantidad mínima: 1'),
  body('items.*.unit_price').isDecimal().withMessage('Precio inválido'),
  body('items.*.discount').optional().isFloat({ min: 0, max: 100 }),
]
```

### Validaciones Especiales — `ecuadorId.js`

#### Cédula Ecuatoriana (10 dígitos)
```
Algoritmo Módulo 10:
1. Los dígitos 0-8 son verificadores, dígito 9 es el dígito de control
2. Multiplicar dígitos pares × 2, impares × 1
3. Si resultado > 9, restar 9
4. Sumar todos los resultados
5. El dígito de control = (10 - (suma mod 10)) mod 10
6. Comparar con dígito 9
```

#### RUC Ecuatoriano (13 dígitos)
```
3 tipos según dígitos 2-3:
- Persona Natural (0-5): Algoritmo módulo 10 en primeros 9 dígitos, dígitos 10-13 = '001'
- Sociedad Privada (9): Algoritmo módulo 11 en primeros 9 dígitos
- Entidad Pública (6): Algoritmo módulo 11 variante
```

---

## 11. Sistema de Autenticación y Autorización

### Flujo de Autenticación

```
POST /api/auth/login
         │
         ▼
   Buscar User por email
         │
   bcrypt.compare(password, password_hash)
         │
   Si OK:
   accessToken  = jwt.sign({ id, email, role, company_id }, JWT_SECRET, 8h)
   refreshToken = jwt.sign({ id }, JWT_REFRESH_SECRET, 7d)
         │
         ▼
   Response: { token, refreshToken, user: { id, email, role, company } }
```

### Flujo de Request Autenticado

```
Request con: Authorization: Bearer <token>
         │
         ▼
authenticate.js:
  jwt.verify(token, JWT_SECRET)
  User.findByPk(payload.id, { include: [Role, Company] })
  req.user = { id, email, company_id, role: { name, scope }, company }
         │
         ▼
authorize('STORE_ADMIN') (si aplica):
  req.user.role.name ∈ roles_permitidos ? next() : 403
         │
         ▼
checkModuleExpiry('MOD_X') (si aplica):
  CompanyModule.findOne({ company_id, module.code })
  Verificar is_active y expires_at
         │
         ▼
validate(rules) (si aplica):
  express-validator.validationResult(req)
  Si errores → 422
         │
         ▼
Controller → Service → Sequelize → PostgreSQL
```

### Renovación de Token

```
POST /api/auth/refresh
Body: { refreshToken }
         │
jwt.verify(refreshToken, JWT_REFRESH_SECRET)
         │
Emitir nuevo accessToken (8h)
```

### Recuperación de Contraseña

```
POST /api/users/forgot-password
  → Genera UUID como reset_token
  → Guarda reset_token + reset_token_expires (1 hora)
  → Envía email con link: FRONTEND_URL/reset-password?token=...

POST /api/users/reset-password
  → Busca user por reset_token donde expires_at > now()
  → bcrypt.hash(newPassword, 10)
  → Limpia reset_token y reset_token_expires
```

---

## 12. Sistema Multi-Tenant

### Modelo de Aislamiento

El sistema implementa **aislamiento lógico por `company_id`**: todos los registros de negocio tienen una FK a `companies.id`, y cada query de servicio incluye siempre la cláusula `WHERE company_id = req.user.company_id`.

```javascript
// Patrón estándar en todos los servicios
const invoices = await Invoice.findAll({
  where: {
    company_id: user.company_id,  // ← siempre presente
    ...filtros
  }
})
```

No existe Row Level Security (RLS) en PostgreSQL — el aislamiento es garantizado por la capa de aplicación.

### Usuarios de Plataforma con Acceso a Tienda

Los usuarios `PLATFORM_*` pueden inspeccionar datos de cualquier empresa usando el parámetro de query `?company_id=X`. El middleware `platformStoreAccess` resuelve este caso:

```javascript
// Si req.user.role.scope === 'PLATFORM' y req.query.company_id existe
// → target_company_id = req.query.company_id
// → se inyecta como req.targetCompanyId para el controller
```

---

## 13. Sistema de Módulos

### Flujo de Solicitud y Aprobación

```
STORE_ADMIN solicita módulo
  POST /api/module-requests
  → CREATE company_module_requests (status: PENDING)
         │
         ▼
PLATFORM_ADMIN revisa
  PATCH /api/module-requests/:id/approve
  → UPDATE request SET status = APPROVED
  → UPSERT company_modules SET is_active = true, expires_at = data.expires_at
  
  PATCH /api/module-requests/:id/reject
  → UPDATE request SET status = REJECTED
         │
         ▼
PLATFORM_ADMIN puede revocar en cualquier momento
  PATCH /api/module-requests/:id/revoke
  → UPDATE request SET status = REVOKED
  → UPDATE company_modules SET is_active = false
```

### Expiración Automática (Lazy + Cron)

**Lazy:** `checkModuleExpiry` verifica `expires_at` en cada request. Si está vencido, desactiva y retorna 403.

**Cron:** `expireModules.job.js` (00:00 diario) hace una pasada completa sobre todos los módulos expirados.

```javascript
// Cron job
await CompanyModule.update(
  { is_active: false },
  { where: { expires_at: { [Op.lt]: new Date() }, is_active: true } }
)
```

---

## 14. Flujos de Negocio Críticos

### 14.1 Creación de Factura (Transacción Atómica)

```
POST /api/invoices
Body: {
  customer_id, issue_date,
  items: [{ product_id, quantity, unit_price, discount, tax_rate_id }]
}

         ┌─ BEGIN TRANSACTION ──────────────────────────────────────────┐
         │                                                               │
         │  1. Cargar todos los products en memoria (bulk findAll)      │
         │  2. Cargar todos los tax_rates en memoria (bulk findAll)     │
         │  3. Validar stock disponible por producto                    │
         │  4. Calcular por línea:                                       │
         │     line_subtotal = qty × price × (1 - discount/100)        │
         │     tax_amount    = line_subtotal × (tax_pct/100)            │
         │     line_total    = line_subtotal + tax_amount               │
         │  5. Acumular subtotal, tax_amount, total de factura          │
         │  6. Generar número: UPDATE company SET sequential++ RETURNING │
         │  7. INSERT invoice                                            │
         │  8. BULK INSERT invoice_details                              │
         │  9. Por cada producto: UPDATE product SET stock -= qty       │
         │  10. BULK INSERT inventory_movements (OUT, SALE)             │
         │                                                               │
         └─ COMMIT ────────────────────────────────────────────────────┘
```

### 14.2 Anulación de Factura (con Reversión de Stock)

```
PATCH /api/invoices/:id/cancel

         ┌─ BEGIN TRANSACTION ──────────────────────────────────────────┐
         │                                                               │
         │  1. Verificar status = ISSUED                                │
         │  2. UPDATE invoice SET status=CANCELLED, payment_status=ANULADO│
         │  3. Cargar todos invoice_details                             │
         │  4. Por cada detail: UPDATE product SET stock += quantity    │
         │  5. BULK INSERT inventory_movements (IN, SALE, nota reversión)│
         │                                                               │
         └─ COMMIT ────────────────────────────────────────────────────┘
```

### 14.3 Registro de Cobro y Actualización de Estado

```
POST /api/invoice-payments
Body: { invoice_id, amount, payment_method, payment_date }

1. Verificar invoice.status = ISSUED (no cancelada)
2. INSERT invoice_payment
3. SELECT SUM(amount) FROM invoice_payments
   WHERE invoice_id = X AND status IN ('PAGADO', 'PENDIENTE')
4. Si sum >= invoice.total:
   UPDATE invoice SET payment_status = 'COBRADO'
5. Si 0 < sum < invoice.total:
   UPDATE invoice SET payment_status = 'PARCIAL'
```

### 14.4 Flujo de Estado de Egreso

```
CREATE expense → payment_status = PENDIENTE
     │
     ├── Registrar pago parcial → PARCIAL
     │
     ├── Registrar pago total   → PAGADO
     │
     └── PATCH /annul           → ANULADO (sin reversión monetaria, solo cambio de estado)
```

### 14.5 Sesión de Caja Chica

```
OPEN:  POST /petty-cash/open
       → CREATE petty_cash { status: OPEN, current_balance = opening_amount }

MOVE:  POST /petty-cash/:id/movements
       → EXPENSE:    current_balance -= amount
       → REPLENISH:  current_balance += amount
       → ADJUSTMENT: current_balance = amount (nuevo saldo)
       → CREATE petty_cash_movement { balance_after = nuevo_balance }
       → UPDATE petty_cash SET current_balance

CLOSE: PATCH /petty-cash/:id/close
       → UPDATE petty_cash { status: CLOSED, closed_at, closed_by, closing_amount_reported }
```

---

## 15. Trabajos Programados (Cron Jobs)

### 15.1 `expireModules.job.js`

```
Horario: 0 0 * * *  (00:00 cada día, zona horaria del servidor)
Acción:
  UPDATE company_modules
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true
Logging: Winston INFO con count de registros afectados
```

### 15.2 `recurringExpenses.job.js`

```
Horario: 0 11 * * *  (11:00 UTC = 06:00 Ecuador)
Acción:
  1. hoy = día actual del mes (1-31)
  2. primerDiaMes = DATE_TRUNC('month', now())
  3. SELECT expense_recurring WHERE:
     - is_active = true
     - day_of_month = hoy
     - (ends_at IS NULL OR ends_at >= hoy)
     - (last_generated_at IS NULL OR last_generated_at < primerDiaMes)
  4. Por cada plantilla (transacción individual):
     a. CREATE expense(company_id, category_id, supplier_id, amount, ...)
     b. UPDATE expense_recurring SET last_generated_at = NOW()
  5. Logging: INFO por cada gasto generado, ERROR por cada fallo (aislado)
```

---

## 16. Configuración de Infraestructura

### 16.1 Base de Datos (`src/config/database.js`)

```javascript
new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT || 5432,
  dialect: 'postgres',
  schema: 'erp',
  pool: {
    max: 10,          // Conexiones simultáneas máximas
    min: 2,           // Conexiones mínimas en el pool
    acquire: 30000,   // Timeout para adquirir conexión (ms)
    idle: 10000       // Tiempo antes de liberar conexión ociosa (ms)
  },
  dialectOptions: {
    ssl: DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : false,
    application_name: 'pymeflowec-backend'
  },
  timezone: 'America/Guayaquil',  // UTC-5
  logging: NODE_ENV === 'development' ? console.log : false,
  define: {
    underscored: true,     // snake_case en columnas
    timestamps: true,
    schema: 'erp'
  }
})
```

### 16.2 Redis (`src/config/redis.js`)

```javascript
// Solo se instancia si REDIS_URL está configurado
if (process.env.REDIS_URL) {
  client = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    enableReadyCheck: false  // Compatible con AWS ElastiCache
  })
}
// Si null → rate limiters usan MemoryStore (no distribuido)
```

### 16.3 Rate Limiting

```javascript
// Rate limiter global
rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS || 900000,  // 15 minutos
  max: RATE_LIMIT_MAX || 300,                // 300 req por ventana
  store: redisStore || new MemoryStore(),
  keyGenerator: (req) => req.user?.id || req.ip  // Por usuario o IP
})

// Rate limiter de login (más estricto)
rateLimit({
  windowMs: 900000,  // 15 minutos
  max: 10,           // 10 intentos de login
  keyGenerator: (req) => req.ip
})
```

### 16.4 Logger Winston

```javascript
// Niveles en desarrollo: debug, http, info, warn, error
// Niveles en producción: info, warn, error

Transports:
  - Console: formato colorizado en dev, JSON en prod
  - File (si LOG_TO_FILE=true):
      logs/error.log    → solo errores, rotación 10MB, máx 5 archivos
      logs/combined.log → todos los niveles, rotación 10MB, máx 5 archivos
```

---

## 17. Formato de Respuestas API

### Respuesta Exitosa — Objeto

```json
{
  "success": true,
  "data": { "id": 1, "name": "Producto A", "..." }
}
```

### Respuesta Exitosa — Lista Paginada

```json
{
  "success": true,
  "data": [ {...}, {...} ],
  "pagination": {
    "total": 150,
    "total_pages": 8,
    "current_page": 1,
    "per_page": 20
  }
}
```

**Parámetros de paginación:** `?page=1&limit=20` (defaults)

### Error de Validación (422)

```json
{
  "success": false,
  "message": "Datos de entrada inválidos.",
  "errors": [
    { "field": "items[0].quantity", "message": "Cantidad mínima: 1" },
    { "field": "customer_id", "message": "Cliente requerido" }
  ]
}
```

### Error de Negocio (400 / 403 / 404 / 409)

```json
{
  "success": false,
  "message": "Stock insuficiente para el producto 'Monitor Dell'"
}
```

### Error de Unicidad (409)

```json
{
  "success": false,
  "message": "El valor de 'email' ya está registrado."
}
```

### Error Interno (500)

```json
{
  "success": false,
  "message": "Error interno del servidor.",
  "stack": "Error: ..." // Solo en NODE_ENV=development
}
```

---

## 18. Seguridad

### Cabeceras HTTP (Helmet)

| Cabecera | Valor / Protección |
|----------|-------------------|
| `Strict-Transport-Security` | HSTS: `max-age=31536000; includeSubDomains` |
| `X-Frame-Options` | `DENY` — previene clickjacking |
| `X-Content-Type-Options` | `nosniff` — previene MIME sniffing |
| `Content-Security-Policy` | Políticas restrictivas por defecto |
| `Referrer-Policy` | `no-referrer` |
| `X-DNS-Prefetch-Control` | `off` |

### Contraseñas

```
Algoritmo: bcryptjs
Cost factor: 10
Hash result: $2b$10$<salt><hash> (60 caracteres)
```

### JWT

```
Algoritmo: HS256 (HMAC + SHA-256)
Clave: JWT_SECRET (mínimo 32 caracteres — pendiente validación B-02)
Access token expiry: JWT_EXPIRES_IN (default: 8h)
Refresh token expiry: JWT_REFRESH_EXPIRES_IN (default: 7d)
```

### CORS

```
Origen permitido: process.env.FRONTEND_URL
Métodos: GET, POST, PUT, PATCH, DELETE
Headers: Content-Type, Authorization
Credenciales: false (JWT en header, no cookies)
```

### Validación de Identidad Ecuador

- **Cédula:** Algoritmo módulo 10 (dígito verificador posición 9)
- **RUC Persona Natural:** Módulo 10 + sufijo `001`
- **RUC Sociedad Privada:** Módulo 11 con coeficientes `[4,3,2,7,6,5,4,3,2]`
- **RUC Entidad Pública:** Módulo 11 con coeficientes `[3,2,7,6,5,4,3,2]`

---

## 19. Observabilidad y Auditoría

### Trail de Auditoría

La tabla `audit_logs` registra toda operación de escritura en la base de datos:
- `INSERT` → `new_values` contiene el registro creado
- `UPDATE` → `old_values` antes, `new_values` después
- `DELETE` → `old_values` contiene el registro eliminado

El middleware `authenticate` establece la variable de sesión PostgreSQL:
```sql
SET LOCAL app.current_user_id = <user_id>;
```

Esto permite que triggers PostgreSQL lean `current_setting('app.current_user_id')` para registrar quién realizó la operación sin necesidad de pasar el ID explícitamente.

### HTTP Request Logging

Cada request HTTP genera un log con:
```
Nivel: http (200), warn (4xx), error (5xx)
Campos: método, URL, código de estado, duración (ms), IP, User-Agent
```

### System Logs

La tabla `system_logs` captura eventos del sistema (auth, cron, errores) con nivel (`DEBUG` a `FATAL`), fuente (`BACKEND`, `AUTH`, `CRON`, etc.) y un campo `details JSONB` para contexto adicional.

---

## 20. Variables de Entorno

```bash
# ── Servidor ───────────────────────────────────────────────────────────────────
NODE_ENV=development           # development | production
PORT=8080                      # Puerto de escucha
FRONTEND_URL=http://localhost:5173  # Origen CORS permitido
API_BASE_URL=https://api.pymeflowec.com  # Solo en producción (Swagger)

# ── Base de Datos ──────────────────────────────────────────────────────────────
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pymeflowec
DB_USER=postgres
DB_PASSWORD=secret
DB_SSL=false                   # true en producción / AWS RDS

# ── Autenticación JWT ──────────────────────────────────────────────────────────
JWT_SECRET=mínimo_32_caracteres_aleatorios
JWT_REFRESH_SECRET=otro_secreto_32_caracteres
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d

# ── Rate Limiting ──────────────────────────────────────────────────────────────
RATE_LIMIT_WINDOW_MS=900000    # Ventana en ms (default 15 min)
RATE_LIMIT_MAX=300             # Solicitudes por ventana

# ── Redis (Opcional) ───────────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379  # Si se omite: MemoryStore in-process

# ── Email SMTP ─────────────────────────────────────────────────────────────────
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=no-reply@pymeflowec.com
MAIL_PASS=app_specific_password
MAIL_FROM="PymeFlowEc <no-reply@pymeflowec.com>"

# ── Logging ────────────────────────────────────────────────────────────────────
LOG_TO_FILE=false              # true: logs en disco | false: solo stdout (ECS/Lambda)
```

---

## 21. Despliegue

### Entorno de Producción Target

| Componente | Servicio AWS |
|-----------|-------------|
| Aplicación | AWS ECS (Fargate) o Lambda con container |
| Base de Datos | AWS RDS PostgreSQL (Multi-AZ) |
| Cache | AWS ElastiCache Redis (cluster mode) |
| Logs | AWS CloudWatch Logs |
| Secretos | AWS Secrets Manager |
| Load Balancer | AWS ALB |

### Comandos de Inicio

```bash
# Desarrollo con hot-reload
npm run dev         # nodemon server.js

# Producción
npm start           # node server.js

# Con PM2 (proceso daemonizado)
pm2 start server.js --name pymeflowec-api
```

### Endpoint de Health Check

```
GET /
→ 200 OK
→ Body: "PymeFlowEc API OK"
(Sin autenticación, ideal para AWS ALB health checks)
```

### Documentación API Interactiva

```
GET /api-docs
→ Swagger UI (OpenAPI 3.0)
→ Servidor base: process.env.API_BASE_URL || http://localhost:8080
```

---

*Documentación generada el 13/05/2026 para defensa de tesis.*  
*Sistema: PymeFlowEc Backend v1.0.0 — Autor: Fernando Navas*
