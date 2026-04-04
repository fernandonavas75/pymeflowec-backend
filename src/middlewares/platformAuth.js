'use strict';

/**
 * Middleware guards for platform-level staff access.
 * Requires authenticate to have run first (req.user populated with platformStaff).
 */

const requirePlatformStaff = (req, res, next) => {
  if (!req.user?.platformStaff?.is_active) {
    return res.status(403).json({
      success: false,
      message: 'Acceso restringido a staff de plataforma.',
    });
  }
  next();
};

const requirePlatformWrite = (req, res, next) => {
  if (!req.user?.platformStaff?.platformRole?.can_write) {
    return res.status(403).json({
      success: false,
      message: 'Se requieren permisos de escritura de plataforma.',
    });
  }
  next();
};

module.exports = { requirePlatformStaff, requirePlatformWrite };
