# PymeFlowEc — Documentación del Backend

**Stack**: Node.js · Express · PostgreSQL 15+ · Sequelize ORM · JWT  
**Schema**: `erp` (PostgreSQL schema)  
**Versión API**: 2.0.0  
**Base URL**: `http://localhost:3000/api`  
**Swagger UI**: `http://localhost:3000/api-docs`

---

## Tabla de contenidos

1. [Sistema de roles](#1-sistema-de-roles)
2. [Autenticación y tokens JWT](#2-autenticación-y-tokens-jwt)
3. [Middlewares](#3-middlewares)
4. [Endpoints](#4-endpoints)
   - [Auth](#41-auth--apiauth)
   - [Usuarios de tienda](#42-usuarios-de-tienda--apiusers)
   - [Empresas](#43-empresas--apicompanies)
   - [Productos](#44-productos--apiproducts)
   - [Clientes](#45-clientes--apicustomers)
   - [Proveedores](#46-proveedores--apisuppliers)
   - [Tasas de impuesto](#47-tasas-de-impuesto--apitax-rates)
   - [Facturas](#48-facturas--apiinvoices)
   - [Módulos](#49-módulos--apiplatformmodules)
   - [Solicitudes de módulos](#410-solicitudes-de-módulos--apimodule-requests)
   - [Usuarios de plataforma](#411-usuarios-de-plataforma--apiplatformusers)
   - [Roles](#412-roles--apiroles)
   - [Logs de auditoría](#413-logs-de-auditoría--apiaudit-logs)
5. [Modelos de base de datos](#5-modelos-de-base-de-datos)
6. [Servicios — lógica de negocio](#6-servicios--lógica-de-negocio)
7. [Formato de respuesta](#7-formato-de-respuesta)
8. [Variables de entorno](#8-variables-de-entorno)

---

## 1. Sistema de roles

El sistema es **multitenant**: cada usuario pertenece a una empresa (`company_id`) o es usuario de plataforma (`company_id = NULL`).

### Roles disponibles

| Rol | Scope | Descripción |
|-----|-------|-------------|
| `PLATFORM_ADMIN` | `PLATFORM` | Administrador global. Gestiona empresas, módulos, usuarios de plataforma y solicitudes. |
| `PLATFORM_SUPPORT` | `PLATFORM` | Soporte técnico. Acceso de solo lectura a datos de tiendas mediante `?company_id`. |
| `STORE_ADMIN` | `STORE` | Administrador de tienda. Acceso completo a su empresa: usuarios, productos, facturas, configuración. |
| `STORE_SELLER` | `STORE` | Vendedor. Puede crear facturas y gestionar clientes. No puede administrar la tienda. |
| `STORE_WAREHOUSE` | `STORE` | Bodeguero. Solo puede ajustar stock. No puede facturar ni administrar. |

### Matriz de acceso por endpoint

| Recurso | PLATFORM_ADMIN | PLATFORM_SUPPORT | STORE_ADMIN | STORE_SELLER | STORE_WAREHOUSE |
|---------|:-:|:-:|:-:|:-:|:-:|
| `/products` (GET) | ✓ `?company_id` | ✓ `?company_id` | ✓ | ✓ | ✓ |
| `/products` (POST/PUT/DELETE) | ✓ | — | ✓ | — | — |
| `/products/:id/stock` (PATCH) | ✓ | — | ✓ | — | ✓ |
| `/invoices` (GET) | ✓ `?company_id` | ✓ `?company_id` | ✓ | ✓ | ✓ |
| `/invoices` (POST) | ✓ | — | ✓ | ✓ | — |
| `/invoices/:id/cancel` | ✓ | — | ✓ | — | — |
| `/customers` (GET) | ✓ `?company_id` | ✓ `?company_id` | ✓ | ✓ | — |
| `/customers` (POST) | ✓ | — | ✓ | ✓ | — |
| `/suppliers` | ✓ `?company_id` | ✓ `?company_id` | ✓ | — | — |
| `/tax-rates` | ✓ `?company_id` | ✓ `?company_id` | ✓ | — | — |
| `/users` | — | — | ✓ | — | — |
| `/companies` | ✓ | ✓ (GET) | — | — | — |
| `/platform/users` | ✓ | — | — | — | — |
| `/module-requests` (store) | — | — | ✓ | — | — |
| `/module-requests/all` | ✓ | ✓ | — | — | — |
| `/module-requests/approve` | ✓ | — | — | — | — |
| `/audit-logs` | ✓ | ✓ | — | — | — |

> `?company_id` indica que los usuarios de plataforma deben pasar el query param `company_id` para acceder a datos de una tienda en modo cliente.

---

## 2. Autenticación y tokens JWT

### Flujo de login

```
POST /api/auth/login
  → Valida email + password (bcrypt)
  → Verifica status del usuario (ACTIVE)
  → Verifica status de la empresa (ACTIVE) si es usuario de tienda
  → Devuelve access_token (8h) + refresh_token (7d)
```

### Estructura del JWT (access token)

```json
{
  "id": 1,
  "company_id": 5,
  "iat": 1700000000,
  "exp": 1700028800
}
```

Firmado con `JWT_SECRET`. El refresh token usa `JWT_REFRESH_SECRET`.

### Usar el token en requests

```
Authorization: Bearer <access_token>
```

### Refresh de token expirado

```
POST /api/auth/refresh
Body: { "refresh_token": "..." }
→ Devuelve nuevo access_token (8h)
```

### Registro de empresa (self-onboarding)

```
POST /api/auth/register
→ Crea empresa + usuario STORE_ADMIN + cliente "Consumidor Final" en una transacción
→ Devuelve tokens (usuario queda autenticado)
```

### Errores de autenticación

| Código | Mensaje | Causa |
|--------|---------|-------|
| 401 | Token no proporcionado. | Header `Authorization` ausente |
| 401 | Token inválido. | Firma JWT incorrecta |
| 401 | Token expirado. | `exp` superado |
| 401 | Usuario no encontrado o inactivo. | Usuario eliminado o inactivo |
| 403 | Empresa inactiva o suspendida. | Empresa del usuario en estado incorrecto |

---

## 3. Middlewares

### `authenticate`
Verifica el JWT y carga el usuario completo (con rol y empresa) en `req.user`.  
Para métodos de escritura (POST/PUT/PATCH/DELETE) registra ip, user-agent y user_id en el log de auditoría al completarse la respuesta (2xx).

### `authorize(...roles)`
Autorización simple basada en nombre de rol o scope.

```js
authorize('STORE_ADMIN')           // solo STORE_ADMIN
authorize('PLATFORM')              // cualquier rol con scope PLATFORM
authorize('STORE_ADMIN', 'PLATFORM') // cualquiera de los dos
```

### `platformStoreAccess(...storeRoles)`
Versión extendida de `authorize` para rutas multitenant:

- **Usuario de tienda**: pasa si su rol coincide con los `storeRoles` indicados.
- **Usuario de plataforma** + `?company_id=X`: inyecta `company_id` en `req.user` para que el controlador funcione sin cambios.  
  - `PLATFORM_ADMIN` puede leer y escribir.  
  - `PLATFORM_SUPPORT` solo puede leer (GET).
- **Otro caso**: 403.

```js
platformStoreAccess('STORE')                        // cualquier rol STORE
platformStoreAccess('STORE_ADMIN')                  // solo admin
platformStoreAccess('STORE_ADMIN', 'STORE_WAREHOUSE') // admin o bodeguero
```

### `requirePlatform` / `requirePlatformAdmin`
Guards de plataforma (definidos en `platformAuth.js`):

- `requirePlatform` → `role.scope === 'PLATFORM'`
- `requirePlatformAdmin` → `role.name === 'PLATFORM_ADMIN'`

### `validate(rules)`
Wrapper de `express-validator`. Devuelve **422** con array de errores si la validación falla.

```json
{
  "success": false,
  "errors": [
    { "field": "email", "message": "Email inválido." }
  ]
}
```

### `errorHandler`
Manejador global de errores. Transforma errores de Sequelize y errores internos a respuestas HTTP:

| Error | Código HTTP |
|-------|-------------|
| `SequelizeValidationError` | 400 |
| `SequelizeUniqueConstraintError` | 409 |
| `SequelizeForeignKeyConstraintError` | 400 |
| `AppError` (custom) | status del error |
| Error desconocido | 500 |

---

## 4. Endpoints

> **Convención**: todos los endpoints requieren `Authorization: Bearer <token>` salvo indicación contraria.

---

### 4.1 Auth — `/api/auth`

#### `POST /api/auth/login`
Autenticar usuario. Limitado a **10 requests/15 min** por IP.

**Sin autenticación.**

**Body:**
```json
{ "email": "jose@donpepe.com", "password": "Password123!" }
```

**Respuesta 200:**
```json
{
  "success": true,
  "user": {
    "id": 3,
    "full_name": "José Pérez",
    "email": "jose@donpepe.com",
    "company_id": 1,
    "role": { "id": 3, "name": "STORE_ADMIN", "scope": "STORE" },
    "company": { "id": 1, "name": "Tienda Don Pepe", "status": "ACTIVE" }
  },
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

---

#### `POST /api/auth/register`
Registro de nueva empresa (self-onboarding). Crea empresa + usuario STORE_ADMIN en una transacción.

**Sin autenticación.**

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

#### `POST /api/auth/refresh`
Renovar access token expirado.

**Sin autenticación.**

**Body:**
```json
{ "refresh_token": "eyJ..." }
```

**Respuesta 200:**
```json
{ "success": true, "access_token": "eyJ..." }
```

---

#### `GET /api/auth/me`
Devuelve el usuario autenticado actual.

**Respuesta 200:**
```json
{
  "success": true,
  "data": { "id": 3, "full_name": "...", "role": {...}, "company": {...} }
}
```

---

#### `PATCH /api/auth/change-password`
Cambiar contraseña del usuario autenticado.

**Body:**
```json
{
  "current_password": "Password123!",
  "new_password": "NuevaPass456!"
}
```

**Respuesta 200:**
```json
{ "success": true, "message": "Contraseña actualizada." }
```

---

### 4.2 Usuarios de tienda — `/api/users`

Todos requieren `STORE_ADMIN` (o plataforma en modo cliente).

#### `GET /api/users`
Listar usuarios de la empresa. Soporta paginación.

**Query params:** `page`, `limit`

**Respuesta 200:**
```json
{
  "success": true,
  "data": [
    { "id": 4, "full_name": "María López", "email": "maria@donpepe.com",
      "status": "ACTIVE", "role": { "name": "STORE_SELLER" } }
  ],
  "total": 3, "page": 1, "limit": 20, "pages": 1
}
```

---

#### `GET /api/users/:id`
Obtener un usuario por ID.

---

#### `POST /api/users`
Crear usuario en la empresa.

**Body:**
```json
{
  "full_name": "Pedro Almeida",
  "email": "pedro@donpepe.com",
  "password": "Password123!",
  "role_id": 5
}
```

> `role_id` debe corresponder a un rol con `scope=STORE`.

**Respuesta 201:**
```json
{ "success": true, "data": { "id": 5, "full_name": "Pedro Almeida", ... } }
```

---

#### `PUT /api/users/:id`
Actualizar datos del usuario.

**Body:** `full_name`, `email`, `role_id` (campos opcionales).

---

#### `PATCH /api/users/:id/activate`
#### `PATCH /api/users/:id/deactivate`
#### `PATCH /api/users/:id/lock`
Cambiar estado del usuario.

**Respuesta 200:**
```json
{ "success": true, "message": "Usuario activado." }
```

---

#### `PATCH /api/users/:id/change-password`
El propio usuario cambia su contraseña (no requiere ser admin, solo autenticado).

**Body:** `current_password`, `new_password`

---

#### `DELETE /api/users/:id`
Soft-delete del usuario.

---

### 4.3 Empresas — `/api/companies`

Requieren scope `PLATFORM`. Las rutas de escritura requieren `PLATFORM_ADMIN`.

#### `GET /api/companies`
Listar todas las empresas. Query params: `page`, `limit`, `search`, `status`.

#### `GET /api/companies/:id`
Obtener empresa por ID (incluye usuarios y módulos activos).

#### `POST /api/companies`
Crear empresa manualmente (solo `PLATFORM_ADMIN`).

**Body:**
```json
{
  "name": "Nueva Tienda",
  "business_name": "Nueva Tienda S.A.",
  "ruc": "1790099887001",
  "email": "info@nueva.com",
  "phone": "0991234567",
  "address": "Av. Principal 123"
}
```

#### `PUT /api/companies/:id`
Actualizar datos de empresa.

#### `PATCH /api/companies/:id/activate`
#### `PATCH /api/companies/:id/deactivate`
#### `PATCH /api/companies/:id/suspend`
Cambiar estado de empresa.

---

### 4.4 Productos — `/api/products`

#### `GET /api/products`
Listar productos de la empresa. Query params: `page`, `limit`, `search`, `status`.

**Roles:** todos (STORE_ADMIN, STORE_SELLER, STORE_WAREHOUSE, plataforma con `?company_id`).

**Respuesta 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1, "sku": "ARR-001", "name": "Arroz 1kg",
      "purchase_price": "0.85", "sale_price": "1.10",
      "stock": 47, "min_stock": 10, "status": "ACTIVE",
      "supplier": { "id": 1, "name": "Distribuidora Nacional S.A." },
      "tax_rate": { "id": 1, "tax_name": "IVA 15%", "percentage": "15.00" }
    }
  ],
  "total": 8, "page": 1, "limit": 20, "pages": 1
}
```

---

#### `GET /api/products/:id`
Obtener producto por ID.

---

#### `POST /api/products`
Crear producto. **Requiere STORE_ADMIN.**

**Body:**
```json
{
  "sku": "LEH-002",
  "name": "Leche descremada 1L",
  "purchase_price": 0.95,
  "sale_price": 1.30,
  "stock": 20,
  "min_stock": 5,
  "supplier_id": 1,
  "tax_rate_id": 1
}
```

**Respuesta 201:** objeto del producto creado.

---

#### `PUT /api/products/:id`
Actualizar producto. **Requiere STORE_ADMIN.**

---

#### `PATCH /api/products/:id/stock`
Ajustar stock (entrada, salida o ajuste manual). **Requiere STORE_ADMIN o STORE_WAREHOUSE.**

**Body:**
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
| `ADJUSTMENT` | Establece stock absoluto |

Crea un registro en `inventory_movements`.

**Respuesta 200:**
```json
{ "success": true, "data": { "id": 1, "stock": 97, ... } }
```

---

#### `PATCH /api/products/:id/activate`
#### `PATCH /api/products/:id/deactivate`
**Requiere STORE_ADMIN.**

---

#### `DELETE /api/products/:id`
Soft-delete. **Requiere STORE_ADMIN.**

---

### 4.5 Clientes — `/api/customers`

#### `GET /api/customers`
Listar clientes. **Roles:** STORE_ADMIN, STORE_SELLER, plataforma.

**Respuesta 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1, "customer_type": "CEDULA",
      "document_number": "1712345678",
      "full_name": "Carlos Mendoza",
      "email": "carlos@email.com", "phone": "0998765432"
    }
  ]
}
```

---

#### `GET /api/customers/:id`
Obtener cliente por ID.

---

#### `POST /api/customers`
Crear cliente. **Roles:** STORE_ADMIN, STORE_SELLER.

**Body:**
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
| `CEDULA` | Cédula de identidad (10 dígitos) |
| `RUC` | RUC empresarial (13 dígitos) |
| `FINAL_CONSUMER` | `9999999999999` (siempre uno por empresa) |

---

#### `PUT /api/customers/:id`
Actualizar cliente. **Requiere STORE_ADMIN.**

---

#### `DELETE /api/customers/:id`
Soft-delete. **Requiere STORE_ADMIN.**

---

### 4.6 Proveedores — `/api/suppliers`

**GET (lista/detalle):** STORE_ADMIN + plataforma.  
**POST/PUT/DELETE:** STORE_ADMIN.

#### `GET /api/suppliers`
**Respuesta 200:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Distribuidora Nacional S.A.", "ruc": "1791234567001",
      "phone": "0991234567", "email": "ventas@distnacional.com" }
  ]
}
```

#### `POST /api/suppliers`
**Body:**
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

### 4.7 Tasas de impuesto — `/api/tax-rates`

**GET:** STORE_ADMIN + plataforma.  
**POST/PUT:** STORE_ADMIN.

#### `GET /api/tax-rates`
**Respuesta 200:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "tax_name": "IVA 15%", "percentage": "15.00",
      "is_active": true, "valid_from": "2024-04-01", "valid_to": null }
  ]
}
```

#### `POST /api/tax-rates`
**Body:**
```json
{
  "tax_name": "IVA 15%",
  "percentage": 15.00,
  "is_active": true,
  "valid_from": "2024-04-01"
}
```

---

### 4.8 Facturas — `/api/invoices`

#### `GET /api/invoices`
Listar facturas. **Roles:** todos STORE + plataforma.

Query params: `page`, `limit`, `status` (ISSUED / CANCELLED).

**Respuesta 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "invoice_number": "001-001-000000001",
      "issue_date": "2026-04-17T10:30:00Z",
      "subtotal": "3.30",
      "tax_amount": "0.50",
      "total": "3.80",
      "status": "ISSUED",
      "customer": { "full_name": "Carlos Mendoza", "document_number": "1712345678" },
      "created_by_user": { "full_name": "María López" }
    }
  ]
}
```

---

#### `GET /api/invoices/:id`
Obtener factura con todos sus ítems.

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "invoice_number": "001-001-000000001",
    "subtotal": "3.30", "tax_amount": "0.50", "total": "3.80",
    "status": "ISSUED",
    "customer": { "full_name": "Carlos Mendoza" },
    "details": [
      {
        "product_name": "Arroz 1kg",
        "quantity": 3,
        "unit_price": "1.10",
        "tax_percentage": "15.00",
        "tax_amount": "0.50",
        "line_subtotal": "3.30",
        "line_total": "3.80"
      }
    ]
  }
}
```

---

#### `POST /api/invoices`
Crear factura con ítems. **Roles:** STORE_ADMIN, STORE_SELLER.

Proceso interno:
1. Valida que cada producto exista y esté `ACTIVE`.
2. Valida stock disponible por producto.
3. Calcula subtotal, impuesto y total por línea.
4. Genera número de factura (`001-001-XXXXXXXXX`).
5. Crea `invoice` + `invoice_details`.
6. Descuenta stock y registra `inventory_movements` (tipo `SALE`).
7. Todo en una única transacción PostgreSQL.

**Body:**
```json
{
  "customer_id": 1,
  "items": [
    { "product_id": 1, "quantity": 3 },
    { "product_id": 2, "quantity": 2 }
  ]
}
```

> `customer_id` es opcional. Si se omite, se usará el Consumidor Final de la empresa.

**Respuesta 201:** objeto de factura completo con detalles.

---

#### `PATCH /api/invoices/:id/cancel`
Cancelar factura (cambia `status` a `CANCELLED`). **Requiere STORE_ADMIN.**

**Respuesta 200:**
```json
{ "success": true, "message": "Factura cancelada." }
```

---

### 4.9 Módulos — `/api/platform/modules`

#### `GET /api/platform/modules/public`
Lista de módulos disponibles (sin autenticación). Para la pantalla de onboarding.

#### `GET /api/platform/modules/active`
Módulos activos de la empresa del usuario autenticado.

#### `GET /api/platform/modules/company-catalog`
Catálogo completo de módulos con estado por empresa: `active`, `pending`, `available`.

**Respuesta 200:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "code": "MOD_INVOICING", "name": "Facturación", "status": "active" },
    { "id": 2, "code": "MOD_INVENTORY", "name": "Inventario",  "status": "pending" },
    { "id": 3, "code": "MOD_REPORTS",   "name": "Reportes",    "status": "available" }
  ]
}
```

#### `GET /api/platform/modules` *(PLATFORM)*
Lista todos los módulos del sistema.

#### `GET /api/platform/modules/:id` *(PLATFORM)*
Detalle de un módulo.

---

### 4.10 Solicitudes de módulos — `/api/module-requests`

#### `GET /api/module-requests` *(STORE_ADMIN)*
Solicitudes de módulos de la empresa.

#### `POST /api/module-requests` *(STORE_ADMIN)*
Solicitar activación de un módulo.

**Body:**
```json
{ "module_id": 3, "comments": "Necesitamos el módulo de reportes." }
```

**Respuesta 201:**
```json
{
  "success": true,
  "data": { "id": 5, "status": "PENDING", "module": { "name": "Reportes" } }
}
```

---

#### `GET /api/module-requests/all` *(PLATFORM)*
Lista todas las solicitudes de todas las empresas. Query params: `status`, `page`, `limit`.

#### `PATCH /api/module-requests/:id/approve` *(PLATFORM_ADMIN)*
Aprobar solicitud. Activa el módulo para la empresa (`company_modules`).

#### `PATCH /api/module-requests/:id/reject` *(PLATFORM_ADMIN)*
Rechazar solicitud.

**Body:**
```json
{ "comments": "El módulo no aplica para su plan actual." }
```

---

### 4.11 Usuarios de plataforma — `/api/platform/users`

Todos requieren `PLATFORM_ADMIN`.

#### `GET /api/platform/users`
Listar usuarios de plataforma (`company_id IS NULL`).

#### `POST /api/platform/users`
Crear usuario de soporte.

**Body:**
```json
{
  "full_name": "Soporte 2",
  "email": "soporte2@pymeflowec.com",
  "password": "Password123!",
  "role_id": 2
}
```

> `role_id` debe corresponder a un rol con `scope=PLATFORM`.

#### `PATCH /api/platform/users/:id/activate`
#### `PATCH /api/platform/users/:id/deactivate`
#### `PATCH /api/platform/users/:id/lock`
Cambiar estado. No puede modificarse a sí mismo.

#### `GET /api/platform/users/companies/:id/users` *(PLATFORM)*
Listar usuarios de una empresa específica (solo lectura, para soporte y admin).

---

### 4.12 Roles — `/api/roles`

#### `GET /api/roles`
Devuelve los roles con `scope=STORE`. Usado para poblar el selector al crear usuarios de tienda.

**Respuesta 200:**
```json
{
  "success": true,
  "data": [
    { "id": 3, "name": "STORE_ADMIN",     "scope": "STORE" },
    { "id": 4, "name": "STORE_SELLER",    "scope": "STORE" },
    { "id": 5, "name": "STORE_WAREHOUSE", "scope": "STORE" }
  ]
}
```

---

### 4.13 Logs de auditoría — `/api/audit-logs`

Requiere scope `PLATFORM`.

#### `GET /api/audit-logs`
Consultar logs. Soporta múltiples filtros.

**Query params:**

| Param | Tipo | Descripción |
|-------|------|-------------|
| `company_id` | number | Filtrar por empresa |
| `action` | string | Tipo de acción (`INSERT`, `UPDATE`, `DELETE`) |
| `table_name` | string | Tabla auditada |
| `date_from` | ISO date | Fecha inicio |
| `date_to` | ISO date | Fecha fin |
| `search` | string | Búsqueda libre |
| `page` | number | Página (default 1) |
| `limit` | number | Registros por página (default 50) |

**Respuesta 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "company_id": 1,
      "user_id": 4,
      "action": "INSERT",
      "table_name": "invoices",
      "record_id": 1,
      "old_values": null,
      "new_values": { "invoice_number": "001-001-000000001", "total": "3.80" },
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2026-04-17T10:30:00Z"
    }
  ],
  "total": 150, "page": 1, "limit": 50, "pages": 3
}
```

---

## 5. Modelos de base de datos

Todos los modelos están en el schema `erp`.

| Modelo | Tabla | Soft-delete | Descripción |
|--------|-------|:-----------:|-------------|
| `Role` | `roles` | — | Catálogo global de roles |
| `Company` | `companies` | ✓ | Tenant (empresa/tienda) |
| `User` | `users` | ✓ | Usuario de plataforma o de tienda |
| `Module` | `modules` | — | Catálogo global de módulos del ERP |
| `CompanyModule` | `company_modules` | — | Módulos activos por empresa |
| `CompanyModuleRequest` | `company_module_requests` | — | Solicitudes de activación de módulos |
| `StoreCustomer` | `store_customers` | ✓ | Clientes de una tienda |
| `Supplier` | `suppliers` | ✓ | Proveedores de una tienda |
| `TaxRate` | `tax_rates` | — | Tasas de IVA por empresa |
| `Product` | `products` | ✓ | Catálogo de productos con stock |
| `Invoice` | `invoices` | ✓ | Facturas emitidas |
| `InvoiceDetail` | `invoice_details` | — | Líneas de cada factura |
| `InventoryMovement` | `inventory_movements` | — | Historial de movimientos de stock |
| `AuditLog` | `audit_logs` | — | Trazabilidad de cambios (poblada por triggers PostgreSQL) |
| `SystemLog` | `system_logs` | — | Logs técnicos del servidor |

### Campos clave por modelo

**`users`**  
`id`, `company_id` (NULL → plataforma), `role_id`, `full_name`, `email` (UNIQUE), `password_hash`, `status` (ACTIVE/INACTIVE/LOCKED)

**`products`**  
`id`, `company_id`, `supplier_id`, `tax_rate_id`, `sku`, `name`, `purchase_price`, `sale_price`, `stock`, `min_stock`, `status`

**`invoices`**  
`id`, `company_id`, `customer_id`, `created_by`, `invoice_number`, `issue_date`, `subtotal`, `tax_amount`, `total`, `status` (ISSUED/CANCELLED)

**`invoice_details`**  
`id`, `invoice_id`, `company_id`, `product_id`, `tax_rate_id`, `product_name`, `quantity`, `unit_price`, `tax_percentage`, `tax_amount`, `line_subtotal`, `line_total`

**`inventory_movements`**  
`id`, `company_id`, `product_id`, `movement_type` (IN/OUT/ADJUSTMENT), `quantity`, `reference_type` (PURCHASE/SALE/MANUAL), `reference_id`, `notes`, `created_by`

---

## 6. Servicios — lógica de negocio

| Servicio | Responsabilidad principal |
|----------|--------------------------|
| `auth.service.js` | Login, registro, refresh de token, cambio de contraseña, generación de JWT |
| `user.service.js` | CRUD de usuarios de tienda, cambio de estado, validación de scope de rol |
| `company.service.js` | CRUD de empresas, cambio de estado (plataforma) |
| `product.service.js` | CRUD de productos, ajuste de stock con movimiento de inventario |
| `invoice.service.js` | Creación de facturas con validación de stock, cálculo de impuestos, descuento de inventario, todo en transacción |
| `storeCustomer.service.js` | CRUD de clientes de tienda |
| `supplier.service.js` | CRUD de proveedores |
| `taxRate.service.js` | CRUD de tasas de IVA |
| `module.service.js` | Consulta de módulos, catálogo con estado por empresa |
| `moduleRequest.service.js` | Solicitar/aprobar/rechazar módulos; al aprobar activa `company_modules` |
| `auditLog.service.js` | Consulta filtrada de logs de auditoría |

---

## 7. Formato de respuesta

### Éxito — lista paginada
```json
{
  "success": true,
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "pages": 5
}
```

### Éxito — objeto único
```json
{
  "success": true,
  "data": { ... }
}
```

### Error de validación (422)
```json
{
  "success": false,
  "errors": [
    { "field": "email", "message": "Email inválido." },
    { "field": "password", "message": "Mínimo 8 caracteres." }
  ]
}
```

### Error de negocio (400 / 403 / 404 / 409)
```json
{
  "success": false,
  "message": "El producto no tiene stock suficiente."
}
```

---

## 8. Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NODE_ENV` | Entorno (`development` / `production`) | `development` |
| `PORT` | Puerto del servidor | `3000` |
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la base de datos | `pymeflowec` |
| `DB_USER` | Usuario de PostgreSQL | `postgres` |
| `DB_PASS` | Contraseña de PostgreSQL | `secret` |
| `JWT_SECRET` | Secreto para access tokens | `super-secret-key` |
| `JWT_REFRESH_SECRET` | Secreto para refresh tokens | `another-secret` |
| `FRONTEND_URL` | URL del frontend para CORS | `http://localhost:5173` |
| `REDIS_URL` | URL de Redis (opcional, para rate limiting) | `redis://localhost:6379` |
| `SMTP_HOST` | Host SMTP para emails | `smtp.gmail.com` |
| `SMTP_PORT` | Puerto SMTP | `587` |
| `SMTP_USER` | Usuario SMTP | `no-reply@pymeflowec.com` |
| `SMTP_PASS` | Contraseña SMTP | `app-password` |
