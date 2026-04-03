'use strict';

require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const compression  = require('compression');
const rateLimit    = require('express-rate-limit');
const swaggerUi    = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

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
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Demasiadas solicitudes. Intenta en 15 minutos.' },
});
app.use('/api', globalLimiter);

// Límites estrictos para endpoints sensibles de autenticación
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Demasiados intentos de inicio de sesión. Intenta en 15 minutos.' },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max:      5,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Demasiadas solicitudes de recuperación. Intenta en 1 hora.' },
});

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PymeFlowEc API',
      version: '1.0.0',
      description: 'API REST del sistema ERP Multi-tenant para PYMEs',
    },
    servers: [
      { url: 'http://localhost:8080/api', description: 'Desarrollo local' },
      { url: 'https://tu-dominio.amazonaws.com/api', description: 'Producción AWS' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => {
  res.status(200).json({
    success:   true,
    message:   'PymeFlowEc API operativa',
    env:       process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ── RUTAS ─────────────────────────────────────────────────────
app.use('/api/auth',            require('./routes/auth.routes')(loginLimiter, forgotPasswordLimiter));
app.use('/api/organizations',   require('./routes/organization.routes'));
app.use('/api/users',           require('./routes/user.routes'));
app.use('/api/clients',         require('./routes/client.routes'));
app.use('/api/suppliers',       require('./routes/supplier.routes'));
app.use('/api/products',        require('./routes/product.routes'));
app.use('/api/categories',      require('./routes/category.routes'));
app.use('/api/tax-rates',       require('./routes/taxRate.routes'));
app.use('/api/roles',           require('./routes/role.routes'));
app.use('/api/orders',          require('./routes/order.routes'));
app.use('/api/invoices',        require('./routes/invoice.routes'));
app.use('/api/payments',        require('./routes/payment.routes'));
app.use('/api/credit-notes',    require('./routes/creditNote.routes'));
app.use('/api/purchase-orders', require('./routes/purchaseOrder.routes'));
app.use('/api/cash-registers',  require('./routes/cashRegister.routes'));
app.use('/api/expenses',        require('./routes/expense.routes'));

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.method} ${req.originalUrl} no encontrada`,
  });
});

// ── ERROR HANDLER ─────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;