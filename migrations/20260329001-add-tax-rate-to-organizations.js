'use strict';
// 20260329001-add-tax-rate-to-organizations.js
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('organizations', 'tax_rate', {
      type:         Sequelize.DECIMAL(5, 4),
      allowNull:    false,
      defaultValue: 0.12,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('organizations', 'tax_rate');
  },
};
