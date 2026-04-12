'use strict';

require('dotenv').config();
const app        = require('./src/app');
const { connectDB } = require('./src/config/database');
const logger     = require('./src/utils/logger');

const PORT = process.env.PORT || 8080;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    logger.info(`PymeFlowEc Backend corriendo en puerto ${PORT}`);
    logger.info(`Entorno: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Docs API: http://localhost:${PORT}/api-docs`);
  });
};

startServer();