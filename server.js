'use strict';

require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/database');

const PORT = process.env.PORT || 8080;

const startServer = async () => {
  // 1. Verificar conexión a la base de datos
  await connectDB();

  // 2. Arrancar el servidor HTTP
  app.listen(PORT, () => {
    console.log(`[SERVER] PymeFlowEc Backend corriendo en puerto ${PORT}`);
    console.log(`[SERVER] Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[SERVER] Docs API: http://localhost:${PORT}/api-docs`);
  });
};

startServer();