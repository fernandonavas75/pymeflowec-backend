# Informe de auditoría — PymeFlowEc (backend + frontend)

**Proyecto:** PymeFlowEc — ERP multi-tenant para PYMEs (tesis)
**Alcance:** `pymeflowec-backend` (Node/Express/Sequelize) + `pymeflowec-front` (Angular)
**Fecha:** 2026-07-04
**Revisor:** Auditoría de arquitectura y seguridad

---

## Resumen ejecutivo

Se revisaron autenticación, middlewares, rutas, services multi-tenant del backend, y guards,
interceptores y almacenamiento del frontend Angular.

**Aspectos correctos:**
- El aislamiento multi-tenant por `company_id` está bien aplicado en los services revisados
  (supplier, user, invoice) mediante `where: { company_id }`.
- El flujo de recuperación de contraseña usa token aleatorio (`crypto.randomBytes(32)`) + hash
  SHA-256 + expiración de 30 min. Diseño correcto.
- Uso de `bcrypt` con coste 12, `helmet`, `compression`, rate limiting con store Redis.

**Aspectos a corregir:** Se detectaron vulnerabilidades **nuevas** que no figuran en el audit
interno del 12/05/2026 (registrado en `CLAUDE.md`). La más grave: creación de facturas sin
ninguna validación de entrada, explotable para fraude y corrupción de inventario.

> **Nota:** Los hallazgos **1, 2, 4, 5, 7, 8 y 9 son nuevos** respecto al audit interno.
> Los B-01…B-09 del `CLAUDE.md` siguen pendientes y se referencian donde aplica.

---

## 🔴 Críticas — seguridad / bugs de runtime

### C-01 · Creación de facturas sin validación — manipulación de stock y precios
**Archivos:** `src/routes/invoice.routes.js` (L99-102), `src/services/invoice.service.js` (L120-168)

No existe `invoice.validators.js` y las rutas de factura no aplican el middleware `validate()`.
En `invoice.service.js` esto es explotable por cualquier `STORE_SELLER`:

- **Cantidad negativa:** `parseInt(item.quantity)` acepta `-50`. El chequeo
  `product.stock < item.quantity` pasa trivialmente y `stock - (-50)` **incrementa** el inventario,
  además de generar una factura con total negativo.
- **Precio arbitrario del cliente:** `item.unit_price ?? product.sale_price` permite facturar
  cualquier producto a `$0.01`, ignorando el precio de venta configurado.
- **`customer_id` de otra empresa:** no se valida que el `customer_id` pertenezca a la empresa
  del usuario (no hay `StoreCustomer.findOne` con `company_id`).

**Impacto:** Fraude, corrupción de stock, cruce de datos entre tenants.
**Acción:**
1. Crear `src/validators/invoice.validators.js` con reglas: `items` array no vacío,
   `quantity` entero `≥ 1`, `unit_price` numérico `≥ 0`, `discount ≥ 0`.
2. Conectar `validate(invoiceCreateRules)` en la ruta POST.
3. En el service, validar que `customer_id` pertenezca a `companyId` y que el `unit_price`
   respete la política de negocio (o eliminar el override de precio desde el cliente).

**Estado:** ✅ Resuelto (2026-07-04) — `invoice.validators.js` reescrito con reglas del endpoint
real y conectado vía `validate(createRules)` en el POST; el service valida `customer_id` contra
`company_id`, rechaza cantidades no enteras o < 1 y descuentos negativos, y **elimina el override
de precio**: `unit_price` siempre se toma de `product.sale_price` (el front ya enviaba ese valor).

---

### C-02 · Interpolación de SQL en `authenticate.js` (+ código muerto)
**Archivo:** `src/middlewares/authenticate.js` (L22)

```js
await sequelize.query(`SET LOCAL app.current_user_id = '${userId}'`);
```

`userId` se interpola directamente en SQL crudo. Aunque proviene de un JWT firmado, es un patrón
de inyección peligroso que no debe replicarse. Además, según el propio comentario del archivo
(L44-52), este `SET LOCAL` **no funciona** con el pool de conexiones de Sequelize —por eso existe
el workaround posterior en `res.on('finish')`—, por lo que es **código muerto** que solo añade
riesgo.

**Acción:** Eliminar la línea, o si se conserva, parametrizar con `replacements` y `set_config()`.
**Estado:** ✅ Resuelto (2026-07-04) — línea eliminada. Era código muerto: el trigger usa
`current_setting('app.current_user_id', TRUE)` (retorna NULL sin error) y el `user_id` real
lo completa el hook `res.on('finish')` con un `UPDATE` parametrizado. Se actualizó también
`DOCUMENTACION_TECNICA.md`, que aún documentaba el `SET LOCAL`.

---

### C-03 · `JWT_SECRET` / `JWT_REFRESH_SECRET` sin validar + fallback predecible (B-02)
**Archivos:** `src/services/auth.service.js` (L22, L77), `src/app.js` (L64)

```js
process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh'
```

Si `JWT_REFRESH_SECRET` no está definido, los refresh tokens se firman con un secreto derivable
del access secret. El rate limiter en `app.js:64` también usa `JWT_SECRET` sin verificar existencia.

**Acción:** Al inicio de `app.js`, validar que `JWT_SECRET` y `JWT_REFRESH_SECRET` estén definidos
y tengan longitud mínima (≥ 32 chars). Si no, lanzar error y detener el proceso (fail-fast).
**Estado:** ✅ Resuelto (2026-07-04) — `app.js` valida al arranque (justo tras `dotenv`) que ambos
secretos existan, tengan ≥ 32 caracteres y sean distintos entre sí; si no, `process.exit(1)`.
En `auth.service.js` se eliminó el fallback `JWT_SECRET + '_refresh'` en firma y verificación de
refresh tokens: ahora se usa exclusivamente `JWT_REFRESH_SECRET`. Verificado: el proceso aborta
con secreto corto/ausente y arranca normal con el `.env` actual.

---

## 🟠 Altas

### A-04 · Rate limiting evadible + `/auth/register` sin limiter
**Archivo:** `src/app.js` (L60-92)

- `extractUserIdFromToken` ejecuta `jwt.verify` en **cada** request al limiter global. Un atacante
  puede forzar verificaciones criptográficas masivas con tokens inválidos antes del fallback por IP.
- `/auth/register` **no tiene limiter específico** → creación masiva de empresas/usuarios y envío
  masivo de correos de bienvenida.

**Acción:** Aplicar `loginLimiter` (o un `registerLimiter` dedicado) a `/auth/register`.
Considerar cachear/limitar el trabajo criptográfico del keyGenerator.
**Estado:** ✅ Resuelto (2026-07-04) — se añadió `registerLimiter` dedicado (5 registros/hora por IP,
store Redis `rl:register:`) aplicado en `POST /auth/register`. El keyGenerator global ahora cachea
el resultado de `jwt.verify` por token en un `Map` acotado (5000 entradas, desalojo FIFO), incluyendo
tokens inválidos, de modo que requests repetidos no re-ejecutan la verificación criptográfica.

---

### A-05 · `rejectUnauthorized: false` en conexión a BD en producción
**Archivo:** `src/config/database.js` (L19-20)

```js
dialectOptions: isProduction || process.env.DB_SSL === 'true'
  ? { ssl: { require: true, rejectUnauthorized: false } } : {}
```

En producción se fuerza SSL pero se desactiva la validación del certificado del servidor,
habilitando MITM sobre la conexión a la base de datos.

**Acción:** Cargar el CA bundle de Amazon RDS y usar `rejectUnauthorized: true`.
**Estado:** ✅ Resuelto (2026-07-04) — se añadió el CA bundle global de RDS en
`src/config/certs/rds-global-bundle.pem` (descargado de truststore.pki.rds.amazonaws.com) y la
conexión SSL ahora usa `rejectUnauthorized: true` con ese `ca`. La ruta es sobreescribible vía
`DB_SSL_CA_PATH`. Si SSL está habilitado y el bundle no puede leerse, el proceso aborta al arranque
(fail-fast). Verificado: arranque sin SSL, con SSL (bundle cargado) y fail-fast con ruta inválida.

---

### A-06 · Suppliers sin `validate()` (B-01)
**Archivo:** `src/routes/supplier.routes.js` (L108-109)

POST/PUT sin el middleware `validate`, pese a que `supplier.validators.js` existe con reglas
completas. Payloads con RUC/email inválidos entran directo a `Supplier.create`.

**Acción:** Importar `validate` y añadir `validate(supplierCreateRules)` /
`validate(supplierUpdateRules)`, igual que `storeCustomer.routes.js`.
**Estado:** ✅ Resuelto (2026-07-04) — `supplier.validators.js` estaba desalineado del endpoint real
(validaba `business_name`, `contact_name`, `payment_terms`, `notes`, campos que no existen en el
modelo); se reescribió con los campos reales (`name` requerido 2-150, `ruc` cédula/RUC Ecuador,
`email`, `phone` ≤20, `address` ≤255) y se conectó `validate(createRules)` / `validate(updateRules)`
en POST/PUT de `supplier.routes.js`. Verificado con payloads válidos e inválidos.

---

### A-07 · `forgot-password`: enumeración de usuarios + sin rate limit
**Archivo:** `src/services/user.service.js` (L110-112)

```js
const user = await User.findOne({ where: { email: ... } });
if (!user) throw new AppError('Usuario no encontrado.', 404);
```

Lanza 404 cuando el email no existe → **permite enumerar** correos registrados, contradiciendo el
propio mensaje "enviado si el usuario existe". No tiene rate limiter → vector de spam de correos.

**Acción:** Devolver siempre 200 con mensaje genérico (no distinguir existencia). Aplicar limiter.
**Estado:** ✅ Resuelto (2026-07-04) — `forgotPassword` devuelve siempre 200 con mensaje genérico
("Si el correo está registrado, recibirás un enlace de recuperación."), tanto si el email no existe
como si el mailer falla (el error se loggea, no se propaga, para no filtrar existencia vía 500).
Se añadió `forgotPasswordLimiter` (5 req/15 min por IP, store Redis `rl:forgot:`) aplicado a
`POST /users/forgot-password` y también a `POST /users/reset-password` (frena fuerza bruta del
token de reset). `user.routes.js` se convirtió en factory que recibe el limiter, igual que
`auth.routes.js`. Verificado contra la BD: email inexistente → 200 genérico, sin 404.

---

## 🟡 Medias — inconsistencias front ↔ back

### M-08 · Desalineación de roles: `PLATFORM_STAFF` (front) vs `PLATFORM_SUPPORT` (back)
**Archivos:** front `src/app/core/models/auth.model.ts` (L26), `permission.guard.ts`, `sidebar.component.ts`;
back `src/middlewares/platformStoreAccess.js` (L37), `src/database/seeds_tesis_v10.sql`

El frontend usa consistentemente **`PLATFORM_STAFF`**; el backend y los seeds usan
**`PLATFORM_SUPPORT`**. Un usuario de soporte real no matchea ninguna comprobación
`=== 'PLATFORM_STAFF'` del front → se rompe la etiqueta de rol y potencialmente la lógica de UI.

**Acción:** Unificar a un único nombre de rol en front, back y seeds.
**Estado:** ✅ Resuelto (2026-07-05) — unificado a **`PLATFORM_SUPPORT`** (el nombre que ya vive en la BD
vía seeds v10 y en `styles.scss` del front, por lo que no requirió migración de datos). En el front se
corrigió el tipo `AuthUser.role.name` (`auth.model.ts`), el mapa `roleLabel` de
`support-users-list.component.ts` (la etiqueta "Staff soporte" ahora sí matchea el rol real) y los
comentarios en `permission.guard.ts`, `sidebar.component.ts` y `auth.service.ts`. En el back solo había
comentarios/docs desalineados: `platformUser.controller.js`, `README.md`, `DOCUMENTACION_TECNICA.md`
y `CLAUDE.md`; docs del front (`README.md`, `Documentacion_tecnica.md`) también actualizados. La lógica
runtime nunca comparaba `PLATFORM_STAFF` en guards (solo `!== 'PLATFORM_ADMIN'`), así que el único bug
funcional era la etiqueta de rol en la UI de usuarios de soporte.

---

### M-09 · `trust proxy` hardcodeado rompe rate limiting fuera de AWS
**Archivo:** `src/app.js` (L26)

`app.set('trust proxy', 1)` está fijo. En entornos sin ALB, Express confía en un
`X-Forwarded-For` falsificable → evasión del rate limiter por IP rotando el header.

**Acción:** Condicionar a `NODE_ENV === 'production'`.
**Estado:** ✅ Resuelto (2026-07-05) — `app.set('trust proxy', 1)` ahora solo se aplica cuando
`NODE_ENV === 'production'` (entorno con ALB real). En dev/test `trust proxy` queda en `false`,
por lo que `X-Forwarded-For` falsificado ya no puede rotar la clave IP del rate limiter.
Verificado cargando la app en ambos entornos (`false` en test, `1` en producción) y con la suite
completa de `pymeflowec-tests`: 447/447 tests, 36 suites.

---

### M-10 · Guard de plataforma demasiado permisivo en el front
**Archivo:** `src/app/core/guards/permission.guard.ts` (L43)

`if (auth.isSystemUser()) return true` — cualquier usuario de plataforma bypasea **todos** los
guards de tienda en el cliente. No es vulnerabilidad real (el backend re-valida) pero, combinado
con M-08, deja la UI de soporte inconsistente.

**Acción:** Revisar si `PLATFORM_STAFF/SUPPORT` debe tener las mismas capacidades de escritura de UI
que `PLATFORM_ADMIN`.
**Estado:** ✅ Resuelto (2026-07-05) — decisión: **no**, `PLATFORM_SUPPORT` es solo lectura, espejando
el backend (`platformStoreAccess`: soporte + `?company_id` = solo GET). Cambios en el front:
1. `permission.guard.ts` — el bypass de plataforma ahora distingue rol: `PLATFORM_ADMIN` conserva el
   bypass total; `PLATFORM_SUPPORT` solo pasa guards de rutas de lectura y es redirigido a
   `/dashboard` en rutas marcadas `data.writeOnly`.
2. `app.routes.ts` — se marcaron `writeOnly: true` las rutas de escritura pura: formularios new/edit
   de customers, products, suppliers, tax-rates y users, `invoices/new` y `settings/invoice`.
   De paso, `customers/new|edit` e `invoices/new` no tenían `permissionGuard` y ahora lo tienen.
3. `auth.service.ts` — nuevo computed `isPlatformSupport`.
4. `sidebar.component.ts` — flag `writeOnly` en `NavItem`; en modo cliente, soporte no ve items de
   escritura pura (hoy solo "Factura" → `/settings/invoice`).
Las páginas mixtas lista+CRUD (categorías, presupuestos, caja chica, etc.) siguen visibles para
soporte porque su parte de lectura es legítima; sus botones de escritura fallan con 403 del backend.
Ocultar esos botones componente a componente queda como mejora de UX futura, no de seguridad.
Verificado con `tsc --noEmit` sin errores.

---

## 🟢 Menores / deuda técnica

- **Tokens en `localStorage`** — `src/app/core/services/auth.service.ts` (L71): expuesto a XSS.
  Preferible `httpOnly cookies`. Mitigado en parte (solo un `bypassSecurityTrustHtml` controlado en
  el componente de íconos).
- **B-03** · N+1 al crear factura (`Product.findOne`+`TaxRate.findOne` por ítem) —
  `invoice.service.js` (L120-137). ⬜
- **B-04** · Validaciones en serie en `product.service.js`. ⬜
- **B-05** · `product.service.js` create/update sin transacción. ⬜
- **B-06** · `invoice.service.js` con demasiadas responsabilidades (>300 LOC). ⬜
- **B-07** · Patrón CRUD duplicado en ≥5 controllers. ⬜
- **B-08** · `validate()` inline en `taxRate.routes.js` (L11) en vez del middleware central. ⬜
- **B-09** · Guard engañoso `STORE_WAREHOUSE`/`ADJUSTMENT`. ⬜

---

## Tabla de prioridades

| ID | Hallazgo | Riesgo | Nuevo | Estado |
|----|----------|--------|:-----:|:------:|
| C-01 | Facturas sin validación (cantidad/precio/customer) | Fraude, corrupción de stock | ✅ | ✅ |
| C-02 | Interpolación SQL en authenticate + código muerto | Inyección | ✅ | ✅ |
| C-03 | JWT secrets sin validar (B-02) | Compromiso de tokens | — | ✅ |
| A-04 | Rate limiting evadible / register sin limiter | DoS, spam | ✅ | ✅ |
| A-05 | `rejectUnauthorized: false` en prod | MITM a la BD | ✅ | ✅ |
| A-06 | Suppliers sin `validate()` (B-01) | Datos inválidos | — | ✅ |
| A-07 | forgot-password: enumeración + sin limiter | Fuga, spam | ✅ | ✅ |
| M-08 | `PLATFORM_STAFF` vs `PLATFORM_SUPPORT` | Rol de soporte roto | ✅ | ✅ |
| M-09 | `trust proxy` hardcodeado | Evasión rate limit | ✅ | ✅ |
| M-10 | Guard de plataforma permisivo (front) | UI inconsistente | — | ✅ |
