'use strict';

/**
 * Permission-based authorization middleware.
 * Usage: authorize('products.create')  — user must hold that permission code.
 *
 * Users with no organization_id are system-level (cross-org admin) and
 * bypass all permission checks automatically.
 */
const authorize = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado.' });
    }

    // System-level users (no org) bypass permission checks
    if (!req.user.organization_id) return next();

    const userPerms = req.user.permissionCodes ?? [];
    const hasPermission = permissions.some(p => userPerms.includes(p));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Sin permiso para realizar esta acción. Se requiere: ${permissions.join(' o ')}.`,
      });
    }

    next();
  };
};

module.exports = authorize;
