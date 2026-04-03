'use strict';

const jwt            = require('jsonwebtoken');
const { sequelize }  = require('../config/database');
const { User, Role, Permission, Organization } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token no proporcionado.' });
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      where: { id: decoded.id, status: 'active' },
      include: [
        {
          model: Role,
          as:    'role',
          include: [{ model: Permission, as: 'permissions', attributes: ['code'] }],
        },
        { model: Organization, as: 'organization' },
      ],
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado o inactivo.' });
    }

    if (user.organization_id && user.organization?.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Organización inactiva.' });
    }

    // Attach flat permission code list for authorize middleware
    user.permissionCodes = user.role?.permissions?.map(p => p.code) ?? [];

    // Set RLS session variable (requires non-privileged DB user for enforcement)
    if (user.organization_id) {
      await sequelize.query(
        `SET LOCAL app.current_org_id = '${user.organization_id}'`
      );
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expirado.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token inválido.' });
    }
    next(err);
  }
};

module.exports = authenticate;
