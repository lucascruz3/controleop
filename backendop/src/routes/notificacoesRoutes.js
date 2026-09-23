const express = require('express');
const router = express.Router();
const sql = require('mssql');
const poolLocal = require('../config/dbLocal');
const { verifyToken } = require('../middlewares/authMiddlewares');

// Listar notificações do usuário logado
router.get('/', verifyToken, async (req, res) => {
  try {
    const request = poolLocal.request();
    request.input('usuarioId', sql.Int, req.userId);

    const result = await request.query(`
      SELECT n.*, p.Nome as NomeProjeto
      FROM Notificacoes n
      JOIN Projetos p ON n.ProjetoID = p.ID
      WHERE n.UsuarioID = @usuarioId
      ORDER BY n.DataCriacao DESC
    `);
    
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    res.status(500).json({ message: 'Erro ao buscar notificações.' });
  }
});

// Marcar notificação como lida
router.put('/:id/ler', verifyToken, async (req, res) => {
  const notificacaoId = req.params.id;
  try {
    const request = poolLocal.request();
    request.input('id', sql.Int, notificacaoId);
    request.input('usuarioId', sql.Int, req.userId);

    await request.query(`
      UPDATE Notificacoes 
      SET Lida = 1 
      WHERE ID = @id AND UsuarioID = @usuarioId
    `);
    
    res.status(200).json({ message: 'Notificação lida.' });
  } catch (error) {
    console.error('Erro ao ler notificação:', error);
    res.status(500).json({ message: 'Erro ao ler notificação.' });
  }
});

module.exports = router;
