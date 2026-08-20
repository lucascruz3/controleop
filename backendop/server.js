require('dotenv').config();
const app = require('./src/app');
const { connectDatabases } = require('./src/config/database');

const PORT = process.env.PORT || 3003;

async function startServer() {
  // 1. Conecta aos bancos de dados ERP e Local
  await connectDatabases();

  // 2. Inicializa o servidor HTTP
  app.listen(PORT, () => {
    console.log(` Servidor rodando na porta ${PORT}`);
  });
}

startServer();