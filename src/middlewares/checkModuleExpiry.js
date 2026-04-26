'use strict';

const { CompanyModule, Module } = require('../models');
const logger                    = require('../utils/logger');

/**
 * Verifica que el módulo indicado siga vigente para la empresa del usuario.
 * Si el registro está vencido lo desactiva de forma lazy y devuelve 403.
 *
 * Uso en rutas:
 *   router.use(checkModuleExpiry('SUPPLIERS'))
 *   router.get('/', checkModuleExpiry('INVOICING'), controller.list)
 *
 * Los usuarios PLATFORM (sin company_id) pasan sin restricción.
 */
function checkModuleExpiry(moduleCode) {
  return async (req, res, next) => {
    try {
      const companyId = req.user?.company_id;
      if (!companyId) return next();

      const cm = await CompanyModule.findOne({
        where: { company_id: companyId, is_active: true },
        include: [{
          model:      Module,
          as:         'module',
          where:      { code: moduleCode },
          attributes: ['id', 'code'],
        }],
      });

      if (!cm) {
        return res.status(403).json({
          success: false,
          message: `No tienes acceso al módulo ${moduleCode}.`,
        });
      }

      if (cm.expires_at && cm.expires_at < new Date()) {
        await cm.update({ is_active: false });
        logger.info(
          `[checkModuleExpiry] Módulo ${moduleCode} vencido para empresa ${companyId} — desactivado`
        );
        return res.status(403).json({
          success: false,
          message: `El módulo ${moduleCode} ha vencido y fue desactivado automáticamente.`,
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { checkModuleExpiry };
