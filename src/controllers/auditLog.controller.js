'use strict';

const service = require('../services/auditLog.service');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);

    const filters = {
      company_id: req.query.company_id ? Number(req.query.company_id) : undefined,
      action:     req.query.action     || undefined,
      table_name: req.query.table_name || undefined,
      date_from:  req.query.date_from  || undefined,
      date_to:    req.query.date_to    || undefined,
      search:     req.query.search     || undefined,
    };

    const result = await service.list(filters, { limit, offset });
    res.status(200).json({ success: true, ...paginatedResponse(result, page, limit) });
  } catch (err) { next(err); }
};

module.exports = { list };
