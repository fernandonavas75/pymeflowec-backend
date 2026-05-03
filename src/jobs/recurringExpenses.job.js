'use strict';

const cron     = require('node-cron');
const { Op }   = require('sequelize');
const { sequelize } = require('../config/database');
const logger   = require('../utils/logger');

// Lazy-load models to avoid circular issues at startup
const getModels = () => require('../models');

// Ejecuta cada día a las 06:00 hora Ecuador (UTC-5 → 11:00 UTC)
const start = () => {
  cron.schedule('0 11 * * *', async () => {
    logger.info('[recurringExpenses] Iniciando generación de egresos recurrentes…');

    const { ExpenseRecurring, Expense } = getModels();
    const today = new Date();
    const currentDay   = today.getDate();
    const currentYear  = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12

    try {
      const templates = await ExpenseRecurring.findAll({
        where: {
          is_active:    true,
          day_of_month: currentDay,
          starts_at:    { [Op.lte]: today },
          [Op.or]: [
            { ends_at: null },
            { ends_at: { [Op.gte]: today } },
          ],
          [Op.or]: [
            { last_generated_at: null },
            {
              last_generated_at: {
                [Op.lt]: new Date(currentYear, currentMonth - 1, 1), // antes del 1ro del mes actual
              },
            },
          ],
        },
      });

      let generated = 0;
      for (const tmpl of templates) {
        try {
          await sequelize.transaction(async (t) => {
            await Expense.create({
              company_id:         tmpl.company_id,
              category_id:        tmpl.category_id,
              supplier_id:        tmpl.supplier_id,
              supplier_name_free: tmpl.supplier_name_free,
              description:        `[Auto] ${tmpl.description}`,
              expense_date:       today,
              amount:             tmpl.amount,
              voucher_type:       tmpl.voucher_type,
              payment_status:     'PENDIENTE',
              created_by:         tmpl.created_by,
            }, { transaction: t });

            await tmpl.update({ last_generated_at: today }, { transaction: t });
          });
          generated++;
        } catch (err) {
          logger.error(`[recurringExpenses] Error al generar egreso para template id=${tmpl.id}: ${err.message}`);
        }
      }

      logger.info(`[recurringExpenses] ${generated} egresos generados de ${templates.length} plantillas activas del día ${currentDay}.`);
    } catch (err) {
      logger.error(`[recurringExpenses] Error general: ${err.message}`);
    }
  }, {
    timezone: 'America/Guayaquil',
  });

  logger.info('[recurringExpenses] Job programado — diario 06:00 Ecuador.');
};

module.exports = { start };
