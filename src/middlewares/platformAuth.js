'use strict';

/**
 * Guards para acceso de plataforma.
 * Basado en role.scope = 'PLATFORM'.
 */

const requirePlatform = (req, res, next) => {
  if (req.user?.role?.scope !== 'PLATFORM') {
    return res.status(403).json({
      success: false,
      message: 'Acceso restringido al personal de plataforma.',
    });
  }
  next();
};

const requirePlatformAdmin = (req, res, next) => {
  if (req.user?.role?.name !== 'PLATFORM_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Acceso restringido al administrador de plataforma.',
    });
  }
  next();
};

module.exports = { requirePlatform, requirePlatformAdmin };
