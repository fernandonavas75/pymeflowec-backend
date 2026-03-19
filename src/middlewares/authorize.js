'use strict';

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado.' });
    }

    const userRole = req.user.role.name;

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Rol '${userRole}' no tiene permiso para esta acción.`,
      });
    }

    next();
  };
};

module.exports = authorize;