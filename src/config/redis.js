'use strict';

/**
 * Cliente Redis opcional.
 * - En local/dev: REDIS_URL no definido → client = null → rate limiters usan memoria.
 * - En AWS (ElastiCache): REDIS_URL definido → cliente ioredis activo.
 */

const logger = require('../utils/logger');

let client = null;

if (process.env.REDIS_URL) {
  const Redis = require('ioredis');

  client = new Redis(process.env.REDIS_URL, {
    lazyConnect:          true,  // no conecta hasta el primer comando
    maxRetriesPerRequest: 3,
    enableReadyCheck:     false, // necesario para ElastiCache sin cluster mode
  });

  client.on('connect', () => logger.info('[Redis] Conectado a ElastiCache'));
  client.on('error',   (err) => logger.warn(`[Redis] ${err.message}`));
}

module.exports = client; // null si REDIS_URL no está configurado
