'use strict';
// 20260329002-add-soft-delete-to-clients-suppliers-products.js
const TABLES = ['clients', 'suppliers', 'products'];

module.exports = {
  async up(queryInterface, Sequelize) {
    for (const table of TABLES) {
      await queryInterface.addColumn(table, 'deleted_at', {
        type:      Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  async down(queryInterface) {
    for (const table of TABLES) {
      await queryInterface.removeColumn(table, 'deleted_at');
    }
  },
};
