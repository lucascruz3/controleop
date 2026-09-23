const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ message: 'Nenhum token fornecido.' });
  }

  // Remove "Bearer " do token se existir
  const tokenLimpo = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;

  const secret = process.env.JWT_SECRET || 'chave_super_secreta_padrao_do_projeto';

  jwt.verify(tokenLimpo, secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Não autorizado. Token inválido ou expirado.' });
    }
    
    // Salva as infos do usuário decodificadas no req para uso nas próximas rotas
    req.userId = decoded.id;
    req.userRole = decoded.acesso; // Ex: ADMIN, DIRETOR, DESIGNER, etc
    next();
  });
};

const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ message: 'Acesso negado. Perfil não identificado.' });
    }

    if (roles.length && !roles.includes(req.userRole.toUpperCase())) {
      return res.status(403).json({ message: 'Você não tem permissão para acessar este recurso.' });
    }

    next();
  };
};

module.exports = { verifyToken, requireRole };
