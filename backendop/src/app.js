const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares essenciais
app.use(cors());
app.use(express.json());

// Rota de teste inicial
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', mensagem: 'API rodando perfeitamente!' });
});

module.exports = app;