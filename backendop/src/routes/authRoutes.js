const express = require('express');
const router = express.Router();
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Importe a pool de conexão Local (Banco 4.5)
const poolLocal = require('../config/dbLocal');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
  }

  try {
    
    const request = poolLocal.request();
    request.input('username', sql.VarChar, username);
    
        
    const result = await request.query(
      'SELECT TOP 1 * FROM usuarios WHERE nome = @username OR email = @username'
    );

    const user = result.recordset[0];

    if (!user) {
      return res.status(401).json({ message: 'Usuário ou senha incorretos.' });
    }

    // Validação de senha usando bcryptjs e a coluna "senha" do banco
    const passwordIsValid = await bcrypt.compare(password, user.senha);

    if (!passwordIsValid) {
      return res.status(401).json({ message: 'Usuário ou senha incorretos.' });
    }

    // Gera o Token JWT para o usuário
    const secret = process.env.JWT_SECRET || 'chave_super_secreta_padrao_do_projeto';
    const token = jwt.sign(
      { id: user.id, username: user.nome, acesso: user.acesso },
      secret,
      { expiresIn: '8h' }
    );

    // Sucesso na autenticação
    return res.status(200).json({
      message: 'Login realizado com sucesso!',
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        acesso: user.acesso
      },
    });

  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(500).json({ message: 'Erro interno ao validar no ERP.' });
  }
});

module.exports = router;