'use strict';

require('dotenv').config();
const { Sequelize } = require('sequelize');
const pg     = require('pg');
const logger = require('../utils/logger');

// PostgreSQL devuelve NUMERIC/DECIMAL como string por defecto.
// Esto lo convierte a número en todas las consultas.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (val) => parseFloat(val));
pg.types.setTypeParser(pg.types.builtins.FLOAT8,  (val) => parseFloat(val));
pg.types.setTypeParser(pg.types.builtins.INT8,    (val) => parseInt(val, 10));

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST,
    port:    parseInt(process.env.DB_PORT) || 5432,
    dialect: 'postgres',

    // SSL obligatorio en AWS RDS, desactivado en local
    dialectOptions: isProduction || process.env.DB_SSL === 'true'
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},

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