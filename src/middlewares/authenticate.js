'use strict';

const jwt           = require('jsonwebtoken');
const { sequelize } = require('../config/database');
const { User, Role, Company } = require('../models');

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token no proporcionado.' });
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.id;

    // Contexto de sesión para los triggers de audit_logs (user_id)
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

    // ── Captura de IP y User-Agent para audit_logs ─────────────────────────
    // SET LOCAL no es fiable entre consultas distintas del pool de conexiones.
    // En su lugar, cuando la respuesta termina con 2xx en una operación de
    // escritura, actualizamos los audit_logs recién creados por los triggers
    // con la IP y el user-agent del request actual.
    if (WRITE_METHODS.has(req.method)) {
      const ip       = req.ip   || null;
      const ua       = (req.get('user-agent') || '').slice(0, 500) || null;
      const since    = new Date();          // marca de tiempo de inicio del request
      const reqUserId = user.id;

      res.on('finish', async () => {
        if (res.statusCode < 200 || res.statusCode >= 300) return;
        try {
          await sequelize.query(
            `UPDATE erp.audit_logs
                SET ip_address = :ip,
                    user_agent = :ua
              WHERE user_id    = :userId
                AND ip_address IS NULL
                AND created_at >= :since`,
            {
              replacements: { ip, ua, userId: reqUserId, since },
              type: sequelize.QueryTypes.UPDATE,
            }
          );
        } catch (_) { /* no interrumpir el request por un fallo de auditoría */ }
      });
    }

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
