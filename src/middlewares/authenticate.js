'use strict';

const jwt            = require('jsonwebtoken');
const { sequelize }  = require('../config/database');
const { User, Role, Permission, Organization, PlatformStaff, PlatformRole } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token no proporcionado.' });
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Establezca las variables de sesión RLS a partir de la carga útil JWT ANTES de consultar la base de datos,
    // para que User.findOne se ejecute con el contexto de inquilino/usuario correcto.
    await sequelize.query(`SET LOCAL app.current_org_id  = '${decoded.organization_id ?? 0}'`);
    await sequelize.query(`SET LOCAL app.current_user_id = '${decoded.id}'`);

    const user = await User.findOne({
      where: { id: decoded.id, status: 'active' },
      include: [
        {
          model: Role,
          as:    'role',
          include: [{ model: Permission, as: 'permissions', attributes: ['code'] }],
        },
        { model: Organization, as: 'organization' },
        {
          model: PlatformStaff,
          as:    'platformStaff',
          required: false,
          where: { is_active: true },
          include: [{ model: PlatformRole, as: 'platformRole' }],
        },
      ],
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado o inactivo.' });
    }

    if (user.organization_id && user.organization?.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Organización inactiva.' });
    }

    // Flat permission code list for authorize middleware
    user.permissionCodes = user.role?.permissions?.map(p => p.code) ?? [];

    // Set RLS session variables
    const orgId  = user.organization_id ?? 0;
    const userId = user.id;
    await sequelize.query(`SET LOCAL app.current_org_id  = '${orgId}'`);
    await sequelize.query(`SET LOCAL app.current_user_id = '${userId}'`);

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
