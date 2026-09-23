require('dotenv').config();
const { syncDashboardData } = require('./src/services/dashboardSyncService');
const poolERP = require('./src/config/dbErp');
const poolLocal = require('./src/config/dbLocal');

async function testSync() {
  try {
    // Conecta nos bancos explicitamente
    await poolERP.connect();
    console.log('Conectado ao ERP!');
    await poolLocal.connect();
    console.log('Conectado ao DB Local!');

    // Executa a função de sincronização
    await syncDashboardData();

  } catch (error) {
    console.error('Erro ao testar a sincronização:', error);
  } finally {
    process.exit(0);
  }
}

testSync();
