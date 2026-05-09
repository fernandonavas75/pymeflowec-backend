'use strict';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT     = 500;

/**
 * Parsea los query params de paginación y devuelve { limit, offset, page }.
 * Uso: const { limit, offset, page } = parsePagination(req.query);
 */
const parsePagination = (query = {}) => {
  const page  = Math.max(1, parseInt(query.page, 10)  || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

/**
 * Formatea la respuesta paginada estándar.
 * @param {object} result  - Resultado de findAndCountAll ({ count, rows })
 * @param {number} page
 * @param {number} limit
 */
const paginatedResponse = (result, page, limit) => ({
  data:       result.rows,
  pagination: {
    total:        result.count,
    total_pages:  Math.ceil(result.count / limit),
    current_page: page,
    per_page:     limit,
  },
});

module.exports = { parsePagination, paginatedResponse };
