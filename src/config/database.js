'use strict';

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const isProduction = process.env.NODE_ENV === 'production';

// SSL con validación de certificado (A-05): se usa el CA bundle global de Amazon RDS
// (https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem), sobreescribible
// vía DB_SSL_CA_PATH. Fail-fast si SSL está habilitado y el bundle no puede leerse.
const useSsl = isProduction || process.env.DB_SSL === 'true';
let sslDialectOptions = {};
if (useSsl) {
  const caPath = process.env.DB_SSL_CA_PATH
    || path.join(__dirname, 'certs', 'rds-global-bundle.pem');
  let ca;
  try {
    ca = fs.readFileSync(caPath, 'utf8');
  } catch (err) {
    console.error(`[FATAL] SSL de BD habilitado pero no se pudo leer el CA bundle en "${caPath}": ${err.message}`);
    process.exit(1);
  }
  sslDialectOptions = { ssl: { require: true, rejectUnauthorized: true, ca } };
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST,
    port:    parseInt(process.env.DB_PORT) || 5432,
    dialect: 'postgres',

    // SSL obligatorio en AWS RDS (con validación de certificado), desactivado en local
    dialectOptions: sslDialectOptions,

    // Pool de conexiones — importante para múltiples tenants simultáneos
    pool: {
      max:     10,   // máximo de conexiones abiertas
      min:     2,    // mínimo mantenidas en reposo
      acquire: 30000, // ms antes de lanzar error si no hay conexión disponible
      idle:    10000  // ms antes de liberar una conexión inactiva
    },

    // Logs: solo en desarrollo, silencioso en producción
    logging: isProduction ? false : (msg) => logger.debug(msg),

    // Convenciones del schema — snake_case, timestamps automáticos
    define: {
      underscored:   true,   // snake_case en columnas
      timestamps:    true,   // created_at y updated_at automáticos
      createdAt:     'created_at',
      updatedAt:     'updated_at',
      freezeTableName: false // Sequelize pluraliza los nombres de tabla
    },

    timezone: '-05:00', // Ecuador (UTC-5)
  }
);

// Función para verificar la conexión al iniciar el servidor
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info(`[DB] Conexión establecida — ${process.env.DB_NAME}@${process.env.DB_HOST}`);
  } catch (error) {
    logger.error('[DB] Error de conexión:', { message: error.message });
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };