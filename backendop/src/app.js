const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');

// Importação das rotas
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const projetoRoutes = require('./routes/projetoRoutes');
const notificacoesRoutes = require('./routes/notificacoesRoutes');

const { syncDashboardData } = require('./services/dashboardSyncService');
const app = express();

// Middlewares essenciais
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos (Uploads de Anexos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', mensagem: 'API rodando perfeitamente!' });
});

// Registro das rotas
app.use('/api', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/projetos', projetoRoutes);
app.use('/api/notificacoes', notificacoesRoutes);

// Agendamento diário à meia-noite (00:00)
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('[CRON] Iniciando sincronização diária...');
    await syncDashboardData();
    console.log('[CRON] Sincronização diária concluída!');
  } catch (error) {
    console.error('[CRON] Erro na sincronização diária:', error);
  }
});

module.exports = app;