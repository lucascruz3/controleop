const express = require('express');
const router = express.Router();
const sql = require('mssql');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const poolLocal = require('../config/dbLocal');
const { verifyToken, requireRole } = require('../middlewares/authMiddlewares');

// Configuração do Multer para upload de anexos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/anexos';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Rota: Listar Projetos
router.get('/', verifyToken, async (req, res) => {
  try {
    const request = poolLocal.request();
    const query = `
      SELECT p.*, u.nome as NomeCriador 
      FROM Projetos p
      LEFT JOIN usuarios u ON p.CriadoPor = u.id
      ORDER BY p.DataAtualizacao DESC
    `;
    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Erro ao listar projetos:', error);
    res.status(500).json({ message: 'Erro ao buscar projetos.' });
  }
});

// Rota: Criar Novo Projeto (Apenas DESIGNER ou ADMIN)
router.post('/', verifyToken, requireRole(['DESIGNER', 'ADMIN', 'DIRETOR']), upload.fields([
  { name: 'capa', maxCount: 1 },
  { name: 'fichaTecnica', maxCount: 1 }
]), async (req, res) => {
  const { nome, descricao } = req.body;
  if (!nome) return res.status(400).json({ message: 'Nome do projeto é obrigatório.' });

  let imagemCapa = null;
  let fichaTecnica = null;

  if (req.files) {
    if (req.files['capa'] && req.files['capa'][0]) {
      imagemCapa = req.files['capa'][0].path.replace(/\\/g, '/').replace(/^uploads\//, '');
    }
    if (req.files['fichaTecnica'] && req.files['fichaTecnica'][0]) {
      fichaTecnica = req.files['fichaTecnica'][0].path.replace(/\\/g, '/').replace(/^uploads\//, '');
    }
  }

  try {
    const request = poolLocal.request();
    request.input('nome', sql.VarChar, nome);
    request.input('descricao', sql.Text, descricao || '');
    request.input('criadoPor', sql.Int, req.userId);
    request.input('imagemCapa', sql.VarChar, imagemCapa);
    request.input('fichaTecnica', sql.VarChar, fichaTecnica);

    const result = await request.query(`
      INSERT INTO Projetos (Nome, Descricao, CriadoPor, FaseAtual, StatusAtual, ImagemCapa, FichaTecnica)
      OUTPUT INSERTED.ID
      VALUES (@nome, @descricao, @criadoPor, 'DESIGN', 'Aguardando Aprovação', @imagemCapa, @fichaTecnica)
    `);

    const novoId = result.recordset[0].ID;

    // Se houver anexo de ficha técnica ou capa, também registra em Projeto_Anexos
    if (fichaTecnica) {
      const anexoReq = poolLocal.request();
      anexoReq.input('projetoId', sql.Int, novoId);
      anexoReq.input('caminho', sql.VarChar, fichaTecnica);
      await anexoReq.query(`
        INSERT INTO Projeto_Anexos (ProjetoID, CaminhoArquivo, FaseInsercao)
        VALUES (@projetoId, @caminho, 'FICHA_TECNICA')
      `);
    }

    if (imagemCapa) {
      const anexoReq = poolLocal.request();
      anexoReq.input('projetoId', sql.Int, novoId);
      anexoReq.input('caminho', sql.VarChar, imagemCapa);
      await anexoReq.query(`
        INSERT INTO Projeto_Anexos (ProjetoID, CaminhoArquivo, FaseInsercao)
        VALUES (@projetoId, @caminho, 'CAPA')
      `);
    }

    // Registra no histórico
    const histRequest = poolLocal.request();
    histRequest.input('projetoId', sql.Int, novoId);
    histRequest.input('usuarioId', sql.Int, req.userId);
    histRequest.input('mensagem', sql.Text, 'Coleção criada com capa e ficha técnica.');
    await histRequest.query(`
      INSERT INTO Projeto_Historico (ProjetoID, UsuarioID, Mensagem)
      VALUES (@projetoId, @usuarioId, @mensagem)
    `);

    res.status(201).json({ message: 'Projeto criado com sucesso!', id: novoId, imagemCapa, fichaTecnica });
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    res.status(500).json({ message: 'Erro interno ao criar projeto.' });
  }
});

// Rota: Detalhes do Projeto (com Histórico e Anexos)
router.get('/:id', verifyToken, async (req, res) => {
  const projetoId = req.params.id;
  try {
    const request = poolLocal.request();
    request.input('id', sql.Int, projetoId);

    // 1. Busca Projeto
    const projResult = await request.query(`
      SELECT p.*, u.nome as NomeCriador 
      FROM Projetos p LEFT JOIN usuarios u ON p.CriadoPor = u.id
      WHERE p.ID = @id
    `);
    
    if (projResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Projeto não encontrado.' });
    }
    const projeto = projResult.recordset[0];

    // 2. Busca Histórico
    const histResult = await request.query(`
      SELECT h.*, u.nome as NomeUsuario, u.acesso as RoleUsuario
      FROM Projeto_Historico h LEFT JOIN usuarios u ON h.UsuarioID = u.id
      WHERE h.ProjetoID = @id
      ORDER BY h.DataCriacao ASC
    `);
    projeto.historico = histResult.recordset;

    // 3. Busca Anexos
    const anexosResult = await request.query(`
      SELECT * FROM Projeto_Anexos WHERE ProjetoID = @id
    `);
    projeto.anexos = anexosResult.recordset;

    res.status(200).json(projeto);
  } catch (error) {
    console.error('Erro ao buscar detalhes do projeto:', error);
    res.status(500).json({ message: 'Erro ao buscar detalhes do projeto.' });
  }
});

// Rota: Enviar Mensagem no Histórico
router.post('/:id/historico', verifyToken, async (req, res) => {
  const projetoId = req.params.id;
  const { mensagem, novoStatus, novaFase } = req.body;

  if (!mensagem) return res.status(400).json({ message: 'A mensagem é obrigatória.' });

  try {
    const request = poolLocal.request();
    request.input('projetoId', sql.Int, projetoId);
    request.input('usuarioId', sql.Int, req.userId);
    request.input('mensagem', sql.Text, mensagem);
    request.input('mudancaDeStatus', sql.VarChar, novoStatus || null);

    // Salva no histórico
    const histResult = await request.query(`
      INSERT INTO Projeto_Historico (ProjetoID, UsuarioID, Mensagem, MudancaDeStatus)
      OUTPUT INSERTED.ID
      VALUES (@projetoId, @usuarioId, @mensagem, @mudancaDeStatus)
    `);
    
    // Se mudou status ou fase, atualiza a tabela Projetos
    if (novoStatus || novaFase) {
      let updateFields = [];
      const updateReq = poolLocal.request();
      updateReq.input('projetoId', sql.Int, projetoId);
      
      if (novoStatus) {
        updateFields.push('StatusAtual = @status');
        updateReq.input('status', sql.VarChar, novoStatus);
      }
      if (novaFase) {
        updateFields.push('FaseAtual = @fase');
        updateReq.input('fase', sql.VarChar, novaFase);
      }
      
      await updateReq.query(`
        UPDATE Projetos 
        SET ${updateFields.join(', ')}, DataAtualizacao = GETDATE()
        WHERE ID = @projetoId
      `);
      
      // Criar Notificação para o DIRETOR se foi enviado para aprovação
      if (novoStatus === 'Aguardando Aprovação do Diretor') {
        const notifReq = poolLocal.request();
        notifReq.input('projetoId', sql.Int, projetoId);
        notifReq.input('msgNotif', sql.VarChar, 'Projeto aguardando sua aprovação.');
        await notifReq.query(`
          INSERT INTO Notificacoes (UsuarioID, ProjetoID, Mensagem)
          SELECT id, @projetoId, @msgNotif FROM usuarios WHERE acesso = 'DIRETOR' OR acesso = 'admin'
        `);
      }
      
      // Criar Notificação para o DESIGNER/MODELISTA se houver ajustes
      if (novoStatus === 'Ajustes Solicitados') {
        const notifReq = poolLocal.request();
        notifReq.input('projetoId', sql.Int, projetoId);
        notifReq.input('msgNotif', sql.VarChar, 'Ajustes solicitados no projeto.');
        await notifReq.query(`
          INSERT INTO Notificacoes (UsuarioID, ProjetoID, Mensagem)
          SELECT CriadoPor, @projetoId, @msgNotif FROM Projetos WHERE ID = @projetoId
        `);
      }
    }

    res.status(201).json({ message: 'Comentário adicionado!', id: histResult.recordset[0].ID });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ message: 'Erro ao enviar mensagem.' });
  }
});

// Rota: Upload de Anexo
router.post('/:id/anexo', verifyToken, upload.single('file'), async (req, res) => {
  const projetoId = req.params.id;
  const file = req.file;
  const { faseInsercao, historicoId } = req.body;

  if (!file) return res.status(400).json({ message: 'Nenhum arquivo enviado.' });

  try {
    const request = poolLocal.request();
    request.input('projetoId', sql.Int, projetoId);
    request.input('historicoId', sql.Int, historicoId || null);
    request.input('caminho', sql.VarChar, file.path);
    request.input('fase', sql.VarChar, faseInsercao || 'DESIGN');

    await request.query(`
      INSERT INTO Projeto_Anexos (ProjetoID, HistoricoID, CaminhoArquivo, FaseInsercao)
      VALUES (@projetoId, @historicoId, @caminho, @fase)
    `);

    res.status(201).json({ message: 'Arquivo anexado com sucesso!', path: file.path });
  } catch (error) {
    console.error('Erro no upload de anexo:', error);
    res.status(500).json({ message: 'Erro no upload de anexo.' });
  }
});

// Rota: Salvar Código ERP (Apenas Modelagem ou Admin)
router.put('/:id/erp', verifyToken, async (req, res) => {
  const projetoId = req.params.id;
  const { referenciaERP } = req.body;

  try {
    const request = poolLocal.request();
    request.input('projetoId', sql.Int, projetoId);
    request.input('ref', sql.VarChar, referenciaERP);

    await request.query(`
      UPDATE Projetos
      SET ReferenciaERP = @ref, DataAtualizacao = GETDATE()
      WHERE ID = @projetoId
    `);

    // Registra no histórico
    const histRequest = poolLocal.request();
    histRequest.input('projetoId', sql.Int, projetoId);
    histRequest.input('usuarioId', sql.Int, req.userId);
    histRequest.input('mensagem', sql.Text, `Código ERP definido como: ${referenciaERP}`);
    await histRequest.query(`
      INSERT INTO Projeto_Historico (ProjetoID, UsuarioID, Mensagem)
      VALUES (@projetoId, @usuarioId, @mensagem)
    `);

    res.status(200).json({ message: 'Código ERP atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar ERP:', error);
    res.status(500).json({ message: 'Erro interno ao salvar Código ERP.' });
  }
});

module.exports = router;
