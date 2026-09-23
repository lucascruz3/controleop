require('dotenv').config({ path: '../../.env' }); // ou o caminho correto
const poolLocal = require('../config/dbLocal');

const createTables = async () => {
  try {
    await poolLocal.connect();
    console.log('Conectado ao Banco Local. Iniciando criação das tabelas...');

    const request = poolLocal.request();

    // 1. Tabela de Projetos (Coleções)
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Projetos' and xtype='U')
      CREATE TABLE Projetos (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        Nome VARCHAR(255) NOT NULL,
        Descricao TEXT,
        FaseAtual VARCHAR(50) DEFAULT 'DESIGN',
        StatusAtual VARCHAR(50) DEFAULT 'Aguardando Aprovação',
        CriadoPor INT,
        DataCriacao DATETIME DEFAULT GETDATE(),
        DataAtualizacao DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('Tabela Projetos verificada/criada.');

    // 2. Tabela de Histórico (Chat)
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Projeto_Historico' and xtype='U')
      CREATE TABLE Projeto_Historico (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        ProjetoID INT NOT NULL,
        UsuarioID INT NOT NULL,
        Mensagem TEXT NOT NULL,
        MudancaDeStatus VARCHAR(100),
        DataCriacao DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (ProjetoID) REFERENCES Projetos(ID) ON DELETE CASCADE
        -- FOREIGN KEY (UsuarioID) REFERENCES usuarios(id)
      )
    `);
    console.log('Tabela Projeto_Historico verificada/criada.');

    // 3. Tabela de Anexos
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Projeto_Anexos' and xtype='U')
      CREATE TABLE Projeto_Anexos (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        ProjetoID INT NOT NULL,
        HistoricoID INT,
        CaminhoArquivo VARCHAR(500) NOT NULL,
        FaseInsercao VARCHAR(50),
        DataCriacao DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (ProjetoID) REFERENCES Projetos(ID) ON DELETE CASCADE
      )
    `);
    console.log('Tabela Projeto_Anexos verificada/criada.');

    // 4. Tabela de Notificações
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Notificacoes' and xtype='U')
      CREATE TABLE Notificacoes (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        UsuarioID INT NOT NULL,
        ProjetoID INT NOT NULL,
        Mensagem VARCHAR(255) NOT NULL,
        Lida BIT DEFAULT 0,
        DataCriacao DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (ProjetoID) REFERENCES Projetos(ID) ON DELETE CASCADE
        -- FOREIGN KEY (UsuarioID) REFERENCES usuarios(id)
      )
    `);
    console.log('Tabela Notificacoes verificada/criada.');

    console.log('Todas as tabelas do PLM foram criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar as tabelas:', error);
  } finally {
    process.exit(0);
  }
};

createTables();
