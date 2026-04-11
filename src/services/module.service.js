'use strict';

const { Module, CompanyModule } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

// Lista todos los módulos del catálogo (admin de plataforma)
const listAll = async () => {
  return Module.findAll({ order: [['code', 'ASC']] });
};

// Lista módulos activos de una empresa
const listActive = async (companyId) => {
  return CompanyModule.findAll({
    where:   { company_id: companyId, is_active: true },
    include: [{ model: Module, as: 'module' }],
    order:   [[{ model: Module, as: 'module' }, 'code', 'ASC']],
  });
};

const getById = async (id) => {
  const mod = await Module.findByPk(id);
  if (!mod) throw new AppError('Módulo no encontrado.', 404);
  return mod;
};

// Lista módulos activos visibles al público (para onboarding)
const listPublic = async () => {
  return Module.findAll({
    where:      { is_active: true },
    attributes: ['id', 'code', 'name', 'description'],
    order:      [['code', 'ASC']],
  });
};

module.exports = { listAll, listActive, getById, listPublic };
