'use strict';

/**
 * Autorización basada en scope y nombre de rol.
 *
 * Uso:
 *   authorize('PLATFORM')          → cualquier rol con scope PLATFORM
 *   authorize('STORE_ADMIN')       → solo STORE_ADMIN
 *   authorize('PLATFORM', 'STORE_ADMIN') → cualquiera de los dos
 */
const authorize = (...allowed) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado.' });
    }

    const roleName  = req.user.role?.name  ?? '';
    const roleScope = req.user.role?.scope ?? '';

    const hasAccess = allowed.some(a => a === roleName || a === roleScope);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere: ${allowed.join(' o ')}.`,
      });
    }

    next();
  };
};

module.exports = authorize;
