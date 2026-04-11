'use strict';

const jwt           = require('jsonwebtoken');
const { sequelize } = require('../config/database');
const { User, Role, Company } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token no proporcionado.' });
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const companyId = decoded.company_id ?? 0;
    const userId    = decoded.id;

    // Informar a la BD el usuario actual (para audit_logs trigger)
    await sequelize.query(`SET LOCAL app.current_user_id = '${userId}'`);

    const user = await User.findOne({
      where: { id: userId, status: 'ACTIVE' },
      include: [
        { model: Role,    as: 'role',    attributes: ['id', 'name', 'scope'] },
        { model: Company, as: 'company', attributes: ['id', 'name', 'status'] },
      ],
      attributes: ['id', 'full_name', 'email', 'company_id', 'role_id', 'status'],
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado o inactivo.' });
    }

    if (user.company_id && user.company?.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Empresa inactiva o suspendida.' });
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
