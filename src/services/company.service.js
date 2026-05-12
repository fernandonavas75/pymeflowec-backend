'use strict';

const { Company, StoreCustomer } = require('../models');
const { sequelize } = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

const list = async ({ limit, offset } = {}) => {
  return Company.findAndCountAll({
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
};

const getById = async (id) => {
  const company = await Company.findByPk(id);
  if (!company) throw new AppError('Empresa no encontrada.', 404);
  return company;
};

const create = async (data) => {
  const { name, business_name, ruc, email, phone, address } = data;

  if (ruc) {
    const exists = await Company.findOne({ where: { ruc } });
    if (exists) throw new AppError('Ya existe una empresa con ese RUC.', 409);
  }

  return sequelize.transaction(async (t) => {
    const company = await Company.create(
      { name, business_name, ruc, email, phone, address },
      { transaction: t }
    );

    await StoreCustomer.create(
      {
        company_id:      company.id,
        customer_type:   'FINAL_CONSUMER',
        document_number: '9999999999999',
        full_name:       'Consumidor Final',
      },
      { transaction: t }
    );

    return company;
  });
};

const update = async (id, data) => {
  const company = await Company.findByPk(id);
  if (!company) throw new AppError('Empresa no encontrada.', 404);

  const allowed = ['name', 'business_name', 'email', 'phone', 'address'];
  const updates = Object.fromEntries(
    Object.entries(data).filter(([k]) => allowed.includes(k))
  );
  await company.update(updates);
  return company;
};

const VALID_TEMPLATES = ['classic', 'modern', 'minimal'];

const getMyInvoiceSettings = async (companyId) => {
  const company = await Company.findByPk(companyId, {
    attributes: ['id', 'invoice_settings'],
  });
  if (!company) throw new AppError('Empresa no encontrada.', 404);
  return company.invoice_settings ?? {};
};

const updateMyInvoiceSettings = async (companyId, data) => {
  const company = await Company.findByPk(companyId);
  if (!company) throw new AppError('Empresa no encontrada.', 404);

  const { display_name, template_id, accent_color, footer_text, establishment, emission_point } = data;

  if (template_id !== undefined && !VALID_TEMPLATES.includes(template_id)) {
    throw new AppError(`template_id inválido. Valores permitidos: ${VALID_TEMPLATES.join(', ')}.`, 422);
  }
  if (accent_color !== undefined && !/^#[0-9a-fA-F]{6}$/.test(accent_color)) {
    throw new AppError('accent_color debe ser un color hex válido (ej. #4f46e5).', 422);
  }
  if (establishment !== undefined && !/^\d{1,3}$/.test(String(establishment))) {
    throw new AppError('establishment debe ser un número entre 1 y 999.', 422);
  }
  if (emission_point !== undefined && !/^\d{1,3}$/.test(String(emission_point))) {
    throw new AppError('emission_point debe ser un número entre 1 y 999.', 422);
  }

  const pad3 = (v) => String(parseInt(v, 10)).padStart(3, '0');

  const current = company.invoice_settings ?? {};
  const updated = {
    ...current,
    ...(display_name   !== undefined ? { display_name }                  : {}),
    ...(template_id    !== undefined ? { template_id }                   : {}),
    ...(accent_color   !== undefined ? { accent_color }                  : {}),
    ...(footer_text    !== undefined ? { footer_text }                   : {}),
    ...(establishment  !== undefined ? { establishment:  pad3(establishment)  } : {}),
    ...(emission_point !== undefined ? { emission_point: pad3(emission_point) } : {}),
  };

  await company.update({ invoice_settings: updated });
  return updated;
};

const setStatus = async (id, status) => {
  const company = await Company.findByPk(id);
  if (!company) throw new AppError('Empresa no encontrada.', 404);
  await company.update({ status });
  return company;
};

module.exports = { list, getById, create, update, setStatus, getMyInvoiceSettings, updateMyInvoiceSettings };
