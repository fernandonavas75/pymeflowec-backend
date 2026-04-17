'use strict';

/**
 * Reemplaza a authorize() en rutas de tienda para permitir también
 * que usuarios de PLATAFORMA accedan en "modo cliente".
 *
 * Lógica:
 *   1. Si el usuario es de tienda y tiene el rol requerido → pasa normal.
 *   2. Si el usuario es de PLATAFORMA y trae ?company_id=X → inyecta ese
 *      company_id en req.user para que los controladores lo lean sin cambios.
 *   3. Cualquier otro caso → 403.
 *
 * Uso (equivalente a authorize()):
 *   platformStoreAccess('STORE')        → cualquier rol de tienda
 *   platformStoreAccess('STORE_ADMIN')  → solo STORE_ADMIN
 */
const platformStoreAccess = (...allowedStoreRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado.' });
    }

    const roleName  = req.user.role?.name  ?? '';
    const roleScope = req.user.role?.scope ?? '';

    // ── Caso 1: usuario de tienda con rol permitido ───────────────────
    const isStoreAllowed = allowedStoreRoles.some(a => a === roleName || a === roleScope);
    if (isStoreAllowed) return next();

    // ── Caso 2: usuario de plataforma en modo cliente ─────────────────
    if (roleScope === 'PLATFORM' && req.query.company_id) {
      const companyId = Number(req.query.company_id);
      if (!Number.isInteger(companyId) || companyId <= 0) {
        return res.status(400).json({ success: false, message: 'company_id inválido.' });
      }

      // Inyectamos company_id en req.user (como objeto plano para evitar
      // conflictos con la instancia Sequelize).
      const plain = req.user.get ? req.user.get({ plain: true }) : { ...req.user };
      req.user = { ...plain, company_id: companyId };
      return next();
    }

    // ── Caso 3: acceso denegado ───────────────────────────────────────
    return res.status(403).json({
      success: false,
      message: `Acceso denegado. Se requiere: ${allowedStoreRoles.join(' o ')}.`,
    });
  };
};

module.exports = platformStoreAccess;
