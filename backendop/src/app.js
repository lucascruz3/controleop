const express = require('express');
const cors = require('cors');

// Importação das rotas
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Middlewares essenciais
app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', mensagem: 'API rodando perfeitamente!' });
});

// Registro da rota de Autenticação
app.use('/api', authRoutes);

// Registro da rota de Dashboard
app.use('/api/dashboard', dashboardRoutes);

module.exports = app;