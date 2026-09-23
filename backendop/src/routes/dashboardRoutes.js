const express = require('express');
const router = express.Router();
const poolERP = require('../config/dbErp');
const { syncDashboardData } = require('../services/dashboardSyncService');

router.post('/sync', async (req, res) => {
  try {
    const result = await syncDashboardData();
    res.status(200).json({ message: 'Sincronização concluída com sucesso!', count: result ? result.count : 0 });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao sincronizar dados', error: error.message });
  }
});


router.get('/ops', async (req, res) => {
  try {
    const poolLocal = require('../config/dbLocal');
    const request = poolLocal.request();
    
    // A tabela foi criada com nomes minúsculos (pedido, op, faseatual, etc.)
    // Mas o seu Front-End espera tudo maiúsculo, igual vinha do ERP (PEDIDO, OP, FASEATUAL).
    // Usamos o AS para renomear as colunas e o front-end voltar a ler corretamente.
    const query = `
      SELECT 
        pedido AS PEDIDO,
        op AS OP,
        produto AS PRODUTO,
        cor AS COR,
        tamanho AS TAMANHO,
        descricao AS DESCRICAO,
        colecao AS COLECAO,
        subcolecao AS SUBCOLECAO,
        quantidade AS QUANTIDADE,
        peso AS PESO,
        faseatual AS FASEATUAL,
        datafase AS DATAFASE,
        dataabertura AS DATAABERTURA,
        quantidadesetor AS QUANTIDADESETOR,
        material AS MATERIAL
      FROM Dashboard 
      ORDER BY FASEATUAL
    `;

    const result = await request.query(query);
    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard local:', error);
    return res.status(500).json({ message: 'Erro interno ao buscar dados do Dashboard local.' });
  }
});

module.exports = router;
