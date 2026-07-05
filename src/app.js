'use strict';

require('dotenv').config();

// Fail-fast: los secretos JWT deben existir y ser suficientemente largos (C-03 / B-02)
for (const name of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
  const value = process.env[name];
  if (!value || value.length < 32) {
    console.error(`[FATAL] La variable de entorno ${name} debe estar definida con al menos 32 caracteres.`);
    process.exit(1);
  }
}
if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
  console.error('[FATAL] JWT_SECRET y JWT_REFRESH_SECRET deben ser distintos.');
  process.exit(1);
}

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const compression  = require('compression');
const rateLimit    = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { ipKeyGenerator } = require('express-rate-limit');
const jwt          = require('jsonwebtoken');
const swaggerUi    = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const path             = require('path');
const logger           = require('./utils/logger');
const redisClient      = require('./config/redis');
const { errorHandler } = require('./middlewares/errorHandler');

const {verifyConnection} = require('./utils/mailer');
if (process.env.NODE_ENV !== 'test') verifyConnection();

const app = express();

// Confía en el proxy de AWS ALB/ECS para IP real del cliente — solo en producción.
// Fuera de un entorno con proxy real, confiar en X-Forwarded-For permitiría
// falsificar la IP y evadir el rate limiting por IP (M-09).
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// HTTP request logger usando winston (reemplaza morgan)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http';
    logger.log(level, `${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });
  next();
});

// Construye opciones de store Redis si el cliente está disponible
const redisStoreOptions = (prefix) =>
  redisClient
    ? { store: new RedisStore({ sendCommand: (...args) => redisClient.call(...args), prefix }) }
    : {};

// Extrae user ID del JWT sin hacer DB lookup — O(1), seguro para usar en keyGenerator.
// Cache acotado token→key: evita repetir jwt.verify en cada request del mismo cliente
// y acota el trabajo criptográfico que puede forzar un atacante con tokens inválidos (A-04).
const TOKEN_KEY_CACHE_MAX = 5000;
const tokenKeyCache = new Map();
const extractUserIdFromToken = (req) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7);
    if (tokenKeyCache.has(token)) {
      const cached = tokenKeyCache.get(token);
      return cached ?? `ip:${ipKeyGenerator(req)}`;
    }
    let key = null; // null → token inválido, se cachea igualmente para no re-verificar
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      key = `user:${decoded.id}`;
    } catch (_) { /* token inválido o expirado → caer a IP */ }
    if (tokenKeyCache.size >= TOKEN_KEY_CACHE_MAX) {
      // Desaloja la entrada más antigua (orden de inserción del Map)
      tokenKeyCache.delete(tokenKeyCache.keys().next().value);
    }
    tokenKeyCache.set(token, key);
    if (key) return key;
  }
  return `ip:${ipKeyGenerator(req)}`;
};

const isTest = process.env.NODE_ENV === 'test';
const passThrough = (req, res, next) => next();

const globalLimiter = isTest ? passThrough : rateLimit({
  windowMs:     parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max:          parseInt(process.env.RATE_LIMIT_MAX, 10) || 300,
  keyGenerator: extractUserIdFromToken,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Demasiadas solicitudes. Intenta en 15 minutos.' },
  ...redisStoreOptions('rl:global:'),
});
app.use('/api', globalLimiter);

const loginLimiter = isTest ? passThrough : rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Demasiados intentos de inicio de sesión. Intenta en 15 minutos.' },
  ...redisStoreOptions('rl:login:'),
});

// Limiter dedicado para registro: evita creación masiva de empresas/usuarios
// y spam de correos de bienvenida (A-04). Clave por IP.
const registerLimiter = isTest ? passThrough : rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      5,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Demasiados registros desde esta dirección. Intenta en 1 hora.' },
  ...redisStoreOptions('rl:register:'),
});

// Limiter para recuperación de contraseña: frena spam de correos y fuerza bruta
// de tokens de reset (A-07). Clave por IP.
const forgotPasswordLimiter = isTest ? passThrough : rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      5,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Demasiadas solicitudes de recuperación. Intenta en 15 minutos.' },
  ...redisStoreOptions('rl:forgot:'),
});

const swaggerServers = [
  { url: 'http://localhost:8080/api', description: 'Desarrollo local' },
];
if (process.env.API_BASE_URL) {
  swaggerServers.unshift({ url: `${process.env.API_BASE_URL}/api`, description: 'Producción' });
}

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PymeFlowEc API',
      version: '2.0.0',
      description: 'API REST del sistema ERP Multi-tenant para PYMEs — Schema v3',
    },
    servers: swaggerServers,
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.join(__dirname, 'routes/*.js')],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => {
  res.status(200).send('PymeFlowEc API OK');
});

/*
app.get('/health', (req, res) => {
  res.status(200).json({
    success:   true,
    message:   'PymeFlowEc API operativa',
    env:       process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});
*/
// ── RUTAS ─────────────────────────────────────────────────────────
app.use('/api/auth',               require('./routes/auth.routes')({ loginLimiter, registerLimiter }));
app.use('/api/companies',          require('./routes/company.routes'));
app.use('/api/roles',              require('./routes/role.routes'));
app.use('/api/users',              require('./routes/user.routes')({ forgotPasswordLimiter }));
app.use('/api/customers',          require('./routes/storeCustomer.routes'));
app.use('/api/suppliers',          require('./routes/supplier.routes'));
app.use('/api/products',           require('./routes/product.routes'));
app.use('/api/product-categories', require('./routes/productCategory.routes'));
app.use('/api/tax-rates',          require('./routes/taxRate.routes'));
app.use('/api/invoices',           require('./routes/invoice.routes'));
app.use('/api/invoice-payments',   require('./routes/invoicePayment.routes'));
app.use('/api/inventory-movements', require('./routes/inventoryMovement.routes'));
app.use('/api/expense-categories', require('./routes/expenseCategory.routes'));
app.use('/api/expenses',           require('./routes/expense.routes'));
app.use('/api/expense-payments',   require('./routes/expensePayment.routes'));
app.use('/api/expense-budgets',    require('./routes/expenseBudget.routes'));
app.use('/api/expense-recurring',  require('./routes/expenseRecurring.routes'));
app.use('/api/petty-cash',         require('./routes/pettyCash.routes'));
app.use('/api/platform/modules',   require('./routes/module.routes'));
app.use('/api/platform',           require('./routes/platform.routes'));
app.use('/api/module-requests',    require('./routes/moduleRequest.routes'));
app.use('/api/audit-logs',         require('./routes/auditLog.routes'));

// ── 404 ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.method} ${req.originalUrl} no encontrada`,
  });
});

// ── ERROR HANDLER ─────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
