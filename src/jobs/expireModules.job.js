'use strict';

const cron              = require('node-cron');
const { Op }            = require('sequelize');
const { CompanyModule } = require('../models');
const logger            = require('../utils/logger');

async function runExpireModules() {
  const [count] = await CompanyModule.update(
    { is_active: false },
    {
      where: {
        is_active:  true,
        expires_at: { [Op.lt]: new Date() },
      },
    }
  );
  if (count > 0) {
    logger.info(`[cron:expireModules] ${count} módulo(s) vencido(s) desactivados`);
  }
  return count;
}

function startExpireModulesJob() {
  // Ejecuta cada día a medianoche (00:00 hora del servidor)
  cron.schedule('0 0 * * *', async () => {
    try {
      await runExpireModules();
    } catch (err) {
      logger.error('[cron:expireModules] Error al desactivar módulos vencidos:', err);
    }
  });

  logger.info('[cron:expireModules] Job programado — se ejecuta diariamente a medianoche');
}

module.exports = { startExpireModulesJob, runExpireModules };
