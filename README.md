# PymeFlowEc — Backend

API REST del sistema ERP multi-tenant para PYMEs ecuatorianas. Proyecto de tesis desarrollado con Node.js, Express y Sequelize sobre PostgreSQL.

**Puerto dev:** `http://localhost:8080` · **Swagger:** `http://localhost:8080/api-docs`  
**Versión API:** 2.0.0 · **Schema DB:** `erp` (PostgreSQL schema)

---

## Tabla de contenidos

1. [Stack tecnológico](#1-stack-tecnológico)
2. [Requisitos previos](#2-requisitos-previos)
3. [Configuración](#3-configuración)
4. [Instalación y arranque](#4-instalación-y-arranque)
5. [Arquitectura del proyecto](#5-arquitectura-del-proyecto)
6. [Sistema de módulos](#6-sistema-de-módulos)
7. [Roles y permisos](#7-roles-y-permisos)
8. [Autenticación JWT](#8-autenticación-jwt)
9. [Middlewares](#9-middlewares)
10. [Endpoints](#10-endpoints)
    - [Auth](#101-auth--apiauth)
    - [Usuarios de tienda](#102-usuarios-de-tienda--apiusers)
    - [Empresas](#103-empresas--apicompanies)
    - [Roles](#104-roles--apiroles)
    - [Productos y stock](#105-productos-y-stock--apiproducts)
    - [Categorías de productos](#106-categorías-de-productos--apiproduct-categories)
    - [Clientes](#107-clientes--apicustomers)
    - [Proveedores](#108-proveedores--apisuppliers)
    - [Tasas de impuesto](#109-tasas-de-impuesto--apitax-rates)
    - [Facturas](#1010-facturas--apiinvoices)
    - [Cobros de facturas](#1011-cobros-de-facturas--apiinvoice-payments)
    - [Movimientos de inventario](#1012-movimientos-de-inventario--apiinventory-movements)
    - [Caja chica](#1013-caja-chica--apipetty-cash)
    - [Categorías de egresos](#1014-categorías-de-egresos--apiexpense-categories)
    - [Egresos](#1015-egresos--apiexpenses)
    - [Pagos de egresos](#1016-pagos-de-egresos--apiexpense-payments)
    - [Presupuestos de egresos](#1017-presupuestos-de-egresos--apiexpense-budgets)
    - [Egresos recurrentes](#1018-egresos-recurrentes--apiexpense-recurring)
    - [Módulos (plataforma)](#1019-módulos-plataforma--apiplatformmodules)
    - [Solicitudes de módulos](#1020-solicitudes-de-módulos--apimodule-requests)
    - [Usuarios de plataforma](#1021-usuarios-de-plataforma--apiplatformusers)
    - [Logs de auditoría](#1022-logs-de-auditoría--apiaudit-logs)
11. [Modelos de base de datos](#11-modelos-de-base-de-datos)
12. [Servicios — lógica de negocio](#12-servicios--lógica-de-negocio)
13. [Tareas programadas](#13-tareas-programadas-cron-jobs)
14. [Formato de respuesta](#14-formato-de-respuesta)
15. [Variables de entorno](#15-variables-de-entorno)

---

## 1. Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js (CommonJS) |
| Framework HTTP | Express 4 |
| ORM | Sequelize 6 + PostgreSQL (pg) |
| Cache / Rate limit | Redis (ioredis + rate-limit-redis) |
| Autenticación | JWT (jsonwebtoken) + bcryptjs |
| Validación | express-validator |
| Seguridad HTTP | helmet, cors, express-rate-limit |
| Documentación API | Swagger (swagger-jsdoc + swagger-ui-express) |
| Logging | Winston |
| Email | Nodemailer |
| Tareas programadas | node-cron |
| Dev tooling | nodemon, eslint, sequelize-cli |

---

## 2. Requisitos previos

- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6 (opcional — el sistema funciona sin él, pero sin rate-limit persistente)

---

## 3. Configuración

Crea un archivo `.env` en la raíz del proyecto:

```env
# Servidor
PORT=8080
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
API_BASE_URL=https://api.tudominio.com   # solo producción

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pymeflowec
DB_USER=postgres
DB_PASSWORD=tu_password

# JWT (mínimo 32 caracteres aleatorios)
JWT_SECRET=una_cadena_aleatoria_de_al_menos_32_caracteres
JWT_REFRESH_SECRET=otra_cadena_aleatoria_de_al_menos_32_caracteres
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# Rate limiting (opcional, valores por defecto indicados)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300

# Email (Nodemailer)
SMTP_HOST=smtp.ejemplo.com
SMTP_PORT=587
SMTP_USER=correo@ejemplo.com
SMTP_PASS=contraseña
```

---

## 4. Instalación y arranque

```bash
# Instalar dependencias
npm install

# Crear la base de datos (ejecutar el schema SQL)
psql -U postgres -d pymeflowec -f src/database/schema_tesis_v10.sql

# (Opcional) Cargar datos de semilla
psql -U postgres -d pymeflowec -f src/database/seeds_tesis_v10.sql

# Servidor de desarrollo con hot reload
npm run dev

# Servidor de producción
npm start
```

---

## 5. Arquitectura del proyecto

```
src/
├── config/
│   ├── database.js           — conexión Sequelize + PostgreSQL
│   └── redis.js              — cliente Redis
├── middlewares/
│   ├── authenticate.js       — verifica JWT, adjunta req.user
│   ├── authorize.js          — verifica roles de tienda (STORE_*)
│   ├── platformAuth.js       — verifica roles de plataforma (PLATFORM_*)
│   ├── platformStoreAccess.js — acceso plataforma a recursos de tienda
│   ├── checkModuleExpiry.js  — verifica módulo activo por empresa
│   ├── validate.js           — ejecuta express-validator, retorna 422
│   └── errorHandler.js       — handler global de errores 500
├── models/                   — modelos Sequelize y asociaciones
├── services/                 — lógica de negocio (sin req/res)
├── controllers/              — manejo HTTP, delega a services
├── routes/                   — define rutas + middlewares + validators
├── validators/               — reglas express-validator por entidad
├── jobs/
│   ├── expireModules.job.js  — cron: expira módulos vencidos (diario 00:00)
│   └── recurringExpenses.job.js — cron: genera egresos desde plantillas (diario 01:00)
└── utils/
    ├── logger.js             — Winston logger
    ├── mailer.js             — Nodemailer
    ├── ecuadorId.js          — validación cédula/RUC Ecuador
    └── pagination.js         — helper paginatedResponse()
```

---

## 6. Sistema de módulos

El acceso a cada área funcional se controla por módulo (`CompanyModule`). Cada empresa activa los módulos que necesita mediante solicitudes que aprueba la plataforma.

| Código | Nombre | Endpoints protegidos |
|--------|--------|---------------------|
| `MOD_INVOICING` | Facturación | `/api/customers`, `/api/invoices`, `/api/invoice-payments` |
| `MOD_PRODUCTS` | Productos e Inventario | `/api/products`, `/api/products/:id/stock`, `/api/inventory-movements`, `/api/product-categories` |
| `MOD_FINANCE` | Finanzas | `/api/petty-cash`, `/api/expenses`, `/api/expense-categories`, `/api/expense-budgets`, `/api/expense-recurring`, `/api/expense-payments` |
| `MOD_PARAMS` | Parámetros del sistema | `/api/suppliers`, `/api/tax-rates`, `/api/audit-logs/my-company` |

---

## 7. Roles y permisos

El sistema es **multi-tenant**: cada usuario pertenece a una empresa (`company_id`) o es usuario de plataforma (`company_id = NULL`).

| Rol | Scope | Descripción |
|-----|-------|-------------|
| `STORE_ADMIN` | STORE | CRUD completo, apertura/cierre de caja, anulaciones |
| `STORE_SELLER` | STORE | Crear facturas, registrar cobros, movimientos de caja |
| `STORE_WAREHOUSE` | STORE | Ajustar stock (IN/OUT, no ADJUSTMENT) |
| `PLATFORM_ADMIN` | PLATFORM | Gestión de empresas, usuarios y módulos |
| `PLATFORM_SUPPORT` | PLATFORM | Solo lectura en modo soporte (`?company_id`) |

### Matriz de acceso principal

| Recurso | PLATFORM_ADMIN | PLATFORM_SUPPORT | STORE_ADMIN | STORE_SELLER | STORE_WAREHOUSE |
|---------|:-:|:-:|:-:|:-:|:-:|
| `/products` GET | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/products` POST/PUT/DELETE | ✓ | — | ✓ | — | — |
| `/products/:id/stock` PATCH | ✓ | — | ✓ | — | ✓ |
| `/invoices` GET | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/invoices` POST | ✓ | — | ✓ | ✓ | — |
| `/invoices/:id/cancel` | ✓ | — | ✓ | — | — |
| `/invoice-payments` | ✓ | ✓ | ✓ | ✓ | — |
| `/customers` GET | ✓ | ✓ | ✓ | ✓ | — |
| `/customers` POST | ✓ | — | ✓ | ✓ | — |
| `/suppliers` | ✓ | ✓ | ✓ | — | — |
| `/tax-rates` | ✓ | ✓ | ✓ | — | — |
| `/petty-cash` abrir/cerrar | ✓ | — | ✓ | — | — |
| `/petty-cash` movimientos | ✓ | — | ✓ | ✓ | — |
| `/expenses` | ✓ | ✓ | ✓ | — | — |
| `/users` | — | — | ✓ | — | — |
| `/companies` GET | ✓ | ✓ | — | — | — |
| `/companies` POST/PUT | ✓ | — | — | — | — |
| `/audit-logs` | ✓ | ✓ | — | — | — |

> Los usuarios de plataforma deben pasar `?company_id=X` para acceder a datos de tienda en modo cliente.

---

## 8. Autenticación JWT

### Flujo de login

```
POST /api/auth/login
  → Valida email + password (bcrypt)
  → Verifica status ACTIVE del usuario y empresa
  → Devuelve access_token (8h) + refresh_token (7d)
```

### Estructura del JWT (access token)

```json
{ "id": 1, "company_id": 5, "iat": 1700000000, "exp": 1700028800 }
```

Firmado con `JWT_SECRET`. El refresh token usa `JWT_REFRESH_SECRET`.

### Usar el token en requests

```
Authorization: Bearer <access_token>
```

### Registro de empresa (self-onboarding)

```
POST /api/auth/register
→ Crea empresa + usuario STORE_ADMIN + cliente "Consumidor Final" en una transacción
→ Devuelve tokens (usuario queda autenticado)
```

### Errores de autenticación

| Código | Causa |
|--------|-------|
| 401 | Token ausente, inválido o expirado |
| 401 | Usuario no encontrado o inactivo |
| 403 | Empresa inactiva o suspendida |
| 403 | Rol sin permisos suficientes |

---

## 9. Middlewares

### `authenticate`
Verifica el JWT y carga el usuario (con rol y empresa) en `req.user`. En métodos de escritura (POST/PUT/PATCH/DELETE) registra ip, user-agent y user_id en el log de auditoría al completarse la respuesta (2xx).

### `authorize(...roles)`
Autorización simple basada en nombre de rol o scope.

```js
authorize('STORE_ADMIN')             // solo STORE_ADMIN
authorize('PLATFORM')                // cualquier rol con scope PLATFORM
authorize('STORE_ADMIN', 'PLATFORM') // cualquiera de los dos
```

### `platformStoreAccess(...storeRoles)`
Versión extendida para rutas multi-tenant:
- **Usuario de tienda**: pasa si su rol coincide con los `storeRoles`.
- **PLATFORM_ADMIN** + `?company_id=X`: acceso completo a la tienda.
- **PLATFORM_SUPPORT** + `?company_id=X`: solo GET.
- **Otro caso**: 403.

### `checkModuleExpiry(moduleCode)`
Verifica que la empresa tenga el módulo activo y no expirado. Retorna 403 si no.

### `validate(rules)`
Wrapper de `express-validator`. Retorna **422** con array de errores si la validación falla:

```json
{
  "success": false,
  "errors": [{ "field": "email", "message": "Email inválido." }]
}
```

### `errorHandler`
Manejador global de errores:

| Error | HTTP |
|-------|------|
| `SequelizeValidationError` | 400 |
| `SequelizeUniqueConstraintError` | 409 |
| `SequelizeForeignKeyConstraintError` | 400 |
| Error interno desconocido | 500 |

---

## 10. Endpoints

> Todos los endpoints requieren `Authorization: Bearer <token>` salvo indicación contraria.  
> Todos los endpoints de lista aceptan `?page=1&limit=20` y retornan la estructura de paginación.

---

### 10.1 Auth — `/api/auth`

#### `POST /api/auth/login` *(sin auth)*
Autenticar usuario. Limitado a **10 req / 15 min** por IP.

**Body:**
```json
{ "email": "jose@donpepe.com", "password": "Password123!" }
```

**Respuesta 200:**
```json
{
  "success": true,
  "user": {
    "id": 3, "full_name": "José Pérez", "email": "jose@donpepe.com",
    "company_id": 1,
    "role": { "id": 3, "name": "STORE_ADMIN", "scope": "STORE" },
    "company": { "id": 1, "name": "Tienda Don Pepe", "status": "ACTIVE" }
  },
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

---

#### `POST /api/auth/register` *(sin auth)*
Registro de nueva empresa. Crea empresa + STORE_ADMIN + cliente Consumidor Final en una transacción.

**Body:**
```json
{
  "company_name": "Mi Tienda",
  "company_ruc": "1790012345001",
  "company_email": "info@mitienda.com",
  "company_phone": "0987654321",
  "full_name": "Ana García",
  "email": "ana@mitienda.com",
  "password": "Password123!"
}
```

**Respuesta 201:** igual que login (user + tokens).

---

#### `POST /api/auth/refresh` *(sin auth)*
Renovar access token expirado.

**Body:** `{ "refresh_token": "eyJ..." }`

**Respuesta 200:** `{ "success": true, "access_token": "eyJ..." }`

---

#### `GET /api/auth/me`
Devuelve el usuario autenticado actual.

#### `PATCH /api/auth/change-password`
Cambiar contraseña del usuario autenticado.

**Body:** `{ "current_password": "...", "new_password": "..." }`

---

### 10.2 Usuarios de tienda — `/api/users`

Requieren `STORE_ADMIN`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/users` | Listar usuarios de la empresa |
| GET | `/api/users/:id` | Obtener usuario por ID |
| POST | `/api/users` | Crear usuario (`role_id` debe ser scope STORE) |
| PUT | `/api/users/:id` | Actualizar datos |
| PATCH | `/api/users/:id/activate` | Activar usuario |
| PATCH | `/api/users/:id/deactivate` | Desactivar usuario |
| PATCH | `/api/users/:id/lock` | Bloquear usuario |
| PATCH | `/api/users/:id/change-password` | Admin cambia contraseña de un usuario |
| DELETE | `/api/users/:id` | Soft-delete |

**Body POST/PUT:**
```json
{
  "full_name": "Pedro Almeida",
  "email": "pedro@donpepe.com",
  "password": "Password123!",
  "role_id": 5
}
```

---

### 10.3 Empresas — `/api/companies`

Requieren scope PLATFORM. Escrituras requieren `PLATFORM_ADMIN`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/companies` | Listar empresas (`?search`, `?status`) |
| GET | `/api/companies/:id` | Detalle con usuarios y módulos activos |
| POST | `/api/companies` | Crear empresa manualmente |
| PUT | `/api/companies/:id` | Actualizar empresa |
| PATCH | `/api/companies/:id/activate` | Activar |
| PATCH | `/api/companies/:id/deactivate` | Desactivar |
| PATCH | `/api/companies/:id/suspend` | Suspender |

---

### 10.4 Roles — `/api/roles`

#### `GET /api/roles`
Devuelve los roles con `scope=STORE`. Usado para poblar el selector al crear usuarios.

---

### 10.5 Productos y stock — `/api/products`

Requiere módulo `MOD_PRODUCTS`.

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/products` | Todos STORE + plataforma | Listar (`?search`, `?status`) |
| GET | `/api/products/:id` | Todos STORE + plataforma | Detalle |
| POST | `/api/products` | STORE_ADMIN | Crear producto |
| PUT | `/api/products/:id` | STORE_ADMIN | Actualizar |
| PATCH | `/api/products/:id/stock` | STORE_ADMIN, STORE_WAREHOUSE | Ajustar stock |
| PATCH | `/api/products/:id/activate` | STORE_ADMIN | Activar |
| PATCH | `/api/products/:id/deactivate` | STORE_ADMIN | Desactivar |
| DELETE | `/api/products/:id` | STORE_ADMIN | Soft-delete |

**Body POST/PUT:**
```json
{
  "sku": "ARR-001",
  "name": "Arroz 1kg",
  "purchase_price": 0.85,
  "sale_price": 1.10,
  "stock": 100,
  "min_stock": 10,
  "supplier_id": 1,
  "tax_rate_id": 1
}
```

**Body PATCH stock:**
```json
{
  "quantity": 50,
  "movement_type": "IN",
  "notes": "Compra a proveedor — factura #0045"
}
```

| `movement_type` | Efecto |
|-----------------|--------|
| `IN` | Suma al stock |
| `OUT` | Resta del stock |
| `ADJUSTMENT` | Establece stock absoluto (solo STORE_ADMIN) |

---

### 10.6 Categorías de productos — `/api/product-categories`

Requiere módulo `MOD_PRODUCTS`.

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/product-categories` | Todos STORE + plataforma | Listar categorías |
| GET | `/api/product-categories/:id` | Todos STORE + plataforma | Detalle |
| POST | `/api/product-categories` | STORE_ADMIN | Crear categoría |
| PUT | `/api/product-categories/:id` | STORE_ADMIN | Actualizar |
| DELETE | `/api/product-categories/:id` | STORE_ADMIN | Eliminar |

**Body POST:**
```json
{ "name": "Lácteos", "description": "Productos derivados de la leche" }
```

---

### 10.7 Clientes — `/api/customers`

Requiere módulo `MOD_INVOICING`.

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/customers` | STORE_ADMIN, STORE_SELLER + plataforma | Listar |
| GET | `/api/customers/:id` | STORE_ADMIN, STORE_SELLER + plataforma | Detalle |
| POST | `/api/customers` | STORE_ADMIN, STORE_SELLER | Crear |
| PUT | `/api/customers/:id` | STORE_ADMIN | Actualizar |
| DELETE | `/api/customers/:id` | STORE_ADMIN | Soft-delete |

**Body POST:**
```json
{
  "customer_type": "CEDULA",
  "document_number": "1712345678",
  "full_name": "Carlos Mendoza",
  "email": "carlos@email.com",
  "phone": "0998765432"
}
```

| `customer_type` | Documento |
|-----------------|-----------|
| `CEDULA` | Cédula 10 dígitos (validación módulo 10) |
| `RUC` | RUC 13 dígitos (validación SRI) |
| `FINAL_CONSUMER` | `9999999999999` — uno por empresa |

---

### 10.8 Proveedores — `/api/suppliers`

Requiere módulo `MOD_PARAMS`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/suppliers` | Listar |
| GET | `/api/suppliers/:id` | Detalle |
| POST | `/api/suppliers` | Crear |
| PUT | `/api/suppliers/:id` | Actualizar |
| DELETE | `/api/suppliers/:id` | Soft-delete |

**Body POST:**
```json
{
  "name": "Proveedor ABC",
  "ruc": "1790099887001",
  "phone": "0991234000",
  "email": "ventas@abc.com",
  "address": "Av. Patria 456, Quito"
}
```

---

### 10.9 Tasas de impuesto — `/api/tax-rates`

Requiere módulo `MOD_PARAMS`. **IVA Ecuador: 15% fijo.**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/tax-rates` | Listar |
| GET | `/api/tax-rates/:id` | Detalle |
| POST | `/api/tax-rates` | Crear tasa |
| PUT | `/api/tax-rates/:id` | Actualizar |

**Body POST:**
```json
{
  "tax_name": "IVA 15%",
  "percentage": 15.00,
  "is_active": true,
  "valid_from": "2024-04-01"
}
```

---

### 10.10 Facturas — `/api/invoices`

Requiere módulo `MOD_INVOICING`.

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/invoices` | Todos STORE + plataforma | Listar (`?status=ISSUED\|CANCELLED`) |
| GET | `/api/invoices/:id` | Todos STORE + plataforma | Detalle con ítems |
| POST | `/api/invoices` | STORE_ADMIN, STORE_SELLER | Crear factura |
| PATCH | `/api/invoices/:id/cancel` | STORE_ADMIN | Cancelar factura |

**Body POST:**
```json
{
  "customer_id": 1,
  "discount_percentage": 5,
  "items": [
    { "product_id": 1, "quantity": 3 },
    { "product_id": 2, "quantity": 2 }
  ]
}
```

> `customer_id` es opcional (usa Consumidor Final si se omite).  
> `discount_percentage` es opcional (0–100).

Proceso interno de creación:
1. Valida que cada producto exista, esté `ACTIVE` y tenga stock suficiente.
2. Calcula subtotal, impuesto y total por línea.
3. Aplica descuento global si se envía `discount_percentage`.
4. Genera número de factura correlativo por empresa (`001-001-XXXXXXXXX`).
5. Crea `invoice` + `invoice_details` + `inventory_movements` (tipo `SALE`) en una única transacción.

**Respuesta detalle de factura:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "invoice_number": "001-001-000000001",
    "subtotal": "3.30",
    "discount_amount": "0.17",
    "tax_amount": "0.47",
    "total": "3.60",
    "status": "ISSUED",
    "customer": { "full_name": "Carlos Mendoza" },
    "details": [
      {
        "product_name": "Arroz 1kg",
        "quantity": 3,
        "unit_price": "1.10",
        "tax_percentage": "15.00",
        "line_subtotal": "3.30",
        "line_total": "3.80"
      }
    ]
  }
}
```

---

### 10.11 Cobros de facturas — `/api/invoice-payments`

Requiere módulo `MOD_INVOICING`.

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/invoice-payments` | STORE_ADMIN, STORE_SELLER + plataforma | Listar cobros |
| GET | `/api/invoice-payments/:id` | STORE_ADMIN, STORE_SELLER + plataforma | Detalle |
| POST | `/api/invoice-payments` | STORE_ADMIN, STORE_SELLER | Registrar cobro |
| DELETE | `/api/invoice-payments/:id` | STORE_ADMIN | Anular cobro |

**Body POST:**
```json
{
  "invoice_id": 1,
  "amount": 3.60,
  "payment_method": "CASH",
  "payment_date": "2026-04-17",
  "notes": "Pago en efectivo"
}
```

| `payment_method` | Descripción |
|-----------------|-------------|
| `CASH` | Efectivo |
| `CARD` | Tarjeta |
| `TRANSFER` | Transferencia |
| `CHECK` | Cheque |

---

### 10.12 Movimientos de inventario — `/api/inventory-movements`

Requiere módulo `MOD_PRODUCTS`.

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/inventory-movements` | Todos STORE + plataforma | Listar movimientos (`?product_id`, `?type`) |
| GET | `/api/inventory-movements/:id` | Todos STORE + plataforma | Detalle |

> Los movimientos se crean automáticamente al ajustar stock o emitir/cancelar facturas. No se crean directamente por este endpoint.

---

### 10.13 Caja chica — `/api/petty-cash`

Requiere módulo `MOD_FINANCE`.

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/petty-cash` | STORE_ADMIN, STORE_SELLER + plataforma | Listar cajas |
| GET | `/api/petty-cash/:id` | STORE_ADMIN, STORE_SELLER + plataforma | Detalle con movimientos |
| POST | `/api/petty-cash` | STORE_ADMIN | Abrir caja |
| PATCH | `/api/petty-cash/:id/close` | STORE_ADMIN | Cerrar caja |
| POST | `/api/petty-cash/:id/movements` | STORE_ADMIN, STORE_SELLER | Agregar movimiento |

**Body abrir caja:**
```json
{ "opening_balance": 50.00, "notes": "Apertura lunes 17 de abril" }
```

**Body movimiento:**
```json
{
  "type": "IN",
  "amount": 20.00,
  "description": "Cobro cliente"
}
```

---

### 10.14 Categorías de egresos — `/api/expense-categories`

Requiere módulo `MOD_FINANCE`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/expense-categories` | Listar |
| GET | `/api/expense-categories/:id` | Detalle |
| POST | `/api/expense-categories` | Crear |
| PUT | `/api/expense-categories/:id` | Actualizar |
| DELETE | `/api/expense-categories/:id` | Eliminar |

**Body POST:**
```json
{ "name": "Servicios básicos", "description": "Agua, luz, internet" }
```

---

### 10.15 Egresos — `/api/expenses`

Requiere módulo `MOD_FINANCE`. Roles: STORE_ADMIN + plataforma.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/expenses` | Listar (`?category_id`, `?status`, `?date_from`, `?date_to`) |
| GET | `/api/expenses/:id` | Detalle |
| POST | `/api/expenses` | Registrar egreso |
| PUT | `/api/expenses/:id` | Actualizar |
| PATCH | `/api/expenses/:id/cancel` | Cancelar egreso |
| DELETE | `/api/expenses/:id` | Eliminar |

**Body POST:**
```json
{
  "category_id": 1,
  "amount": 150.00,
  "description": "Factura de luz — abril",
  "expense_date": "2026-04-30",
  "due_date": "2026-05-05"
}
```

---

### 10.16 Pagos de egresos — `/api/expense-payments`

Requiere módulo `MOD_FINANCE`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/expense-payments` | Listar pagos |
| GET | `/api/expense-payments/:id` | Detalle |
| POST | `/api/expense-payments` | Registrar pago |
| DELETE | `/api/expense-payments/:id` | Anular pago |

**Body POST:**
```json
{
  "expense_id": 1,
  "amount": 150.00,
  "payment_method": "TRANSFER",
  "payment_date": "2026-05-01"
}
```

---

### 10.17 Presupuestos de egresos — `/api/expense-budgets`

Requiere módulo `MOD_FINANCE`. Solo STORE_ADMIN.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/expense-budgets` | Listar presupuestos (`?year`, `?month`) |
| GET | `/api/expense-budgets/:id` | Detalle con ejecución vs presupuesto |
| POST | `/api/expense-budgets` | Crear presupuesto |
| PUT | `/api/expense-budgets/:id` | Actualizar |
| DELETE | `/api/expense-budgets/:id` | Eliminar |

**Body POST:**
```json
{
  "category_id": 1,
  "year": 2026,
  "month": 4,
  "amount": 500.00
}
```

---

### 10.18 Egresos recurrentes — `/api/expense-recurring`

Requiere módulo `MOD_FINANCE`. Solo STORE_ADMIN.

Plantillas que el job cron procesa para generar egresos automáticamente.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/expense-recurring` | Listar plantillas |
| GET | `/api/expense-recurring/:id` | Detalle |
| POST | `/api/expense-recurring` | Crear plantilla |
| PUT | `/api/expense-recurring/:id` | Actualizar |
| PATCH | `/api/expense-recurring/:id/activate` | Activar plantilla |
| PATCH | `/api/expense-recurring/:id/deactivate` | Desactivar |
| DELETE | `/api/expense-recurring/:id` | Eliminar |

**Body POST:**
```json
{
  "category_id": 1,
  "amount": 45.00,
  "description": "Suscripción internet",
  "frequency": "MONTHLY",
  "day_of_month": 1,
  "start_date": "2026-01-01"
}
```

| `frequency` | Descripción |
|-------------|-------------|
| `MONTHLY` | Una vez al mes |
| `WEEKLY` | Una vez a la semana |
| `BIWEEKLY` | Cada dos semanas |

---

### 10.19 Módulos (plataforma) — `/api/platform/modules`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/platform/modules/public` | Sin auth | Módulos disponibles (para onboarding) |
| GET | `/api/platform/modules/active` | Autenticado | Módulos activos de la empresa |
| GET | `/api/platform/modules/company-catalog` | Autenticado | Catálogo con estado por empresa |
| GET | `/api/platform/modules` | PLATFORM | Todos los módulos del sistema |
| GET | `/api/platform/modules/:id` | PLATFORM | Detalle de módulo |

**Respuesta `company-catalog`:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "code": "MOD_INVOICING", "name": "Facturación",        "status": "active" },
    { "id": 2, "code": "MOD_PRODUCTS",  "name": "Productos",           "status": "pending" },
    { "id": 3, "code": "MOD_FINANCE",   "name": "Finanzas",            "status": "available" },
    { "id": 4, "code": "MOD_PARAMS",    "name": "Parámetros sistema",  "status": "available" }
  ]
}
```

---

### 10.20 Solicitudes de módulos — `/api/module-requests`

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/module-requests` | STORE_ADMIN | Solicitudes de la empresa |
| POST | `/api/module-requests` | STORE_ADMIN | Solicitar módulo |
| GET | `/api/module-requests/all` | PLATFORM | Todas las solicitudes |
| PATCH | `/api/module-requests/:id/approve` | PLATFORM_ADMIN | Aprobar → activa módulo |
| PATCH | `/api/module-requests/:id/reject` | PLATFORM_ADMIN | Rechazar |

**Body POST:**
```json
{ "module_id": 3, "comments": "Necesitamos el módulo de finanzas." }
```

---

### 10.21 Usuarios de plataforma — `/api/platform/users`

Requieren `PLATFORM_ADMIN` salvo lectura.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/platform/users` | Listar usuarios de plataforma |
| POST | `/api/platform/users` | Crear usuario de soporte |
| PATCH | `/api/platform/users/:id/activate` | Activar |
| PATCH | `/api/platform/users/:id/deactivate` | Desactivar |
| PATCH | `/api/platform/users/:id/lock` | Bloquear |
| GET | `/api/platform/companies/:id/users` | Usuarios de una empresa (PLATFORM) |

---

### 10.22 Logs de auditoría — `/api/audit-logs`

Requiere scope PLATFORM.

#### `GET /api/audit-logs`

**Query params:**

| Param | Tipo | Descripción |
|-------|------|-------------|
| `company_id` | number | Filtrar por empresa |
| `action` | string | `INSERT`, `UPDATE`, `DELETE` |
| `table_name` | string | Tabla auditada |
| `date_from` | ISO date | Fecha inicio |
| `date_to` | ISO date | Fecha fin |
| `search` | string | Búsqueda libre |
| `page` | number | Página (default 1) |
| `limit` | number | Por página (default 50) |

---

## 11. Modelos de base de datos

Todos los modelos están en el schema `erp`.

| Modelo | Tabla | Soft-delete | Descripción |
|--------|-------|:-----------:|-------------|
| `Role` | `roles` | — | Catálogo global de roles |
| `Company` | `companies` | ✓ | Tenant (empresa/tienda) |
| `User` | `users` | ✓ | Usuario de plataforma o de tienda |
| `Module` | `modules` | — | Catálogo global de módulos del ERP |
| `CompanyModule` | `company_modules` | — | Módulos activos por empresa |
| `CompanyModuleRequest` | `company_module_requests` | — | Solicitudes de activación |
| `StoreCustomer` | `store_customers` | ✓ | Clientes de tienda |
| `Supplier` | `suppliers` | ✓ | Proveedores de tienda |
| `TaxRate` | `tax_rates` | — | Tasas de IVA por empresa |
| `ProductCategory` | `product_categories` | — | Categorías de productos |
| `Product` | `products` | ✓ | Catálogo de productos con stock |
| `Invoice` | `invoices` | ✓ | Facturas emitidas |
| `InvoiceDetail` | `invoice_details` | — | Líneas de cada factura |
| `InvoicePayment` | `invoice_payments` | ✓ | Cobros asociados a facturas |
| `InventoryMovement` | `inventory_movements` | — | Historial de movimientos de stock |
| `PettyCash` | `petty_cash` | — | Cajas chicas (apertura/cierre) |
| `PettyCashMovement` | `petty_cash_movements` | — | Movimientos de caja chica |
| `ExpenseCategory` | `expense_categories` | — | Categorías de egresos |
| `Expense` | `expenses` | ✓ | Egresos registrados |
| `ExpensePayment` | `expense_payments` | ✓ | Pagos de egresos |
| `ExpenseBudget` | `expense_budgets` | — | Presupuestos mensuales por categoría |
| `ExpenseRecurring` | `expense_recurring` | — | Plantillas de egresos recurrentes |
| `AuditLog` | `audit_logs` | — | Trazabilidad (poblada por triggers PostgreSQL) |
| `SystemLog` | `system_logs` | — | Logs técnicos del servidor |

### Campos clave

**`invoices`**  
`id`, `company_id`, `customer_id`, `created_by`, `invoice_number`, `issue_date`, `subtotal`, `discount_percentage`, `discount_amount`, `tax_amount`, `total`, `status` (ISSUED/CANCELLED)

**`invoice_details`**  
`id`, `invoice_id`, `product_id`, `tax_rate_id`, `product_name`, `quantity`, `unit_price`, `tax_percentage`, `tax_amount`, `line_subtotal`, `line_total`

**`petty_cash`**  
`id`, `company_id`, `opened_by`, `closed_by`, `opening_balance`, `closing_balance`, `status` (OPEN/CLOSED), `opened_at`, `closed_at`

**`expenses`**  
`id`, `company_id`, `category_id`, `amount`, `description`, `expense_date`, `due_date`, `status` (PENDING/PAID/CANCELLED), `is_recurring`

---

## 12. Servicios — lógica de negocio

| Servicio | Responsabilidad |
|----------|----------------|
| `auth.service.js` | Login, registro, refresh de token, JWT |
| `user.service.js` | CRUD de usuarios de tienda, cambio de estado |
| `company.service.js` | CRUD de empresas (plataforma) |
| `product.service.js` | CRUD de productos, ajuste de stock |
| `productCategory.service.js` | CRUD de categorías de productos |
| `storeCustomer.service.js` | CRUD de clientes |
| `supplier.service.js` | CRUD de proveedores |
| `taxRate.service.js` | CRUD de tasas de IVA |
| `invoice.service.js` | Creación de facturas (transacción: calcular, descontar stock, registrar movimientos), cancelación |
| `invoicePayment.service.js` | Cobros de facturas, anulación |
| `inventoryMovement.service.js` | Consulta del historial de movimientos |
| `pettyCash.service.js` | Apertura/cierre de caja, movimientos |
| `expenseCategory.service.js` | CRUD de categorías |
| `expense.service.js` | CRUD de egresos, cancelación |
| `expensePayment.service.js` | Pagos de egresos |
| `expenseBudget.service.js` | Presupuestos mensuales |
| `expenseRecurring.service.js` | Plantillas de egresos recurrentes |
| `module.service.js` | Catálogo de módulos con estado por empresa |
| `moduleRequest.service.js` | Solicitar/aprobar/rechazar módulos |
| `auditLog.service.js` | Consulta filtrada de logs de auditoría |

---

## 13. Tareas programadas (cron jobs)

| Job | Horario | Acción |
|-----|---------|--------|
| `expireModules.job.js` | Diario 00:00 | Marca como expirados los `CompanyModule` con fecha vencida |
| `recurringExpenses.job.js` | Diario 01:00 | Genera egresos automáticos desde plantillas `ExpenseRecurring` activas |

---

## 14. Formato de respuesta

### Lista paginada

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "total_pages": 5,
    "current_page": 1,
    "per_page": 20
  }
}
```

### Objeto único

```json
{ "success": true, "data": { ... } }
```

### Error de validación (422)

```json
{
  "success": false,
  "errors": [
    { "field": "email", "message": "Email inválido." }
  ]
}
```

### Error de negocio (400 / 403 / 404 / 409)

```json
{ "success": false, "message": "El producto no tiene stock suficiente." }
```

---

## 15. Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NODE_ENV` | Entorno | `development` |
| `PORT` | Puerto del servidor | `8080` |
| `FRONTEND_URL` | URL del frontend (CORS) | `http://localhost:5173` |
| `API_BASE_URL` | URL pública de la API (Swagger en prod) | `https://api.tudominio.com` |
| `DB_HOST` | Host PostgreSQL | `localhost` |
| `DB_PORT` | Puerto PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la base de datos | `pymeflowec` |
| `DB_USER` | Usuario PostgreSQL | `postgres` |
| `DB_PASS` | Contraseña PostgreSQL | `secret` |
| `JWT_SECRET` | Secreto access token (≥32 chars) | `super-secret-key-32chars` |
| `JWT_REFRESH_SECRET` | Secreto refresh token (≥32 chars) | `another-secret-32chars` |
| `JWT_EXPIRES_IN` | Duración access token | `8h` |
| `JWT_REFRESH_EXPIRES_IN` | Duración refresh token | `7d` |
| `REDIS_URL` | URL de Redis (opcional) | `redis://localhost:6379` |
| `RATE_LIMIT_WINDOW_MS` | Ventana rate limit global (ms) | `900000` |
| `RATE_LIMIT_MAX` | Máx. requests por ventana | `300` |
| `SMTP_HOST` | Host SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | Puerto SMTP | `587` |
| `SMTP_USER` | Usuario SMTP | `no-reply@pymeflowec.com` |
| `SMTP_PASS` | Contraseña SMTP | `app-password` |

---

## Frontend

El frontend de este proyecto se encuentra en:

```
C:\Users\navas\OneDrive\Escritorio\Tesis\Tesis\pymeflowec-front
```

Espera que el backend corra en `http://localhost:8080` durante desarrollo.

---

## Licencia

Proyecto académico de tesis — Fernando Navas. Todos los derechos reservados.
