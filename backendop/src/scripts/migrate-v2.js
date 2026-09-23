require('dotenv').config();
const sql = require('mssql');
const dbLocal = require('../config/dbLocal');

async function migrate() {
  try {
    await dbLocal.connect();
    console.log('Conectado. Iniciando migração V2...');

    // Criar Campanhas (As colunas do Trello)
    await dbLocal.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Campanhas' and xtype='U')
      CREATE TABLE Campanhas (
        ID INT PRIMARY KEY IDENTITY(1,1),
        Nome VARCHAR(100) NOT NULL,
        Ordem INT DEFAULT 0,
        DataCriacao DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('Tabela Campanhas ok.');

    // Inserir campanhas padrão se não existir
    const checkCamp = await dbLocal.query('SELECT COUNT(*) as count FROM Campanhas');
    if (checkCamp.recordset[0].count === 0) {
      await dbLocal.query(`
        INSERT INTO Campanhas (Nome, Ordem) VALUES 
        ('1º Sem 26 - Peças Conceito', 1),
        ('1º Sem 26 - Namorados', 2),
        ('2º Sem 26 - Pais', 3)
      `);
    }

    // Criar Coleções (Os cards do Trello)
    await dbLocal.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Colecoes' and xtype='U')
      CREATE TABLE Colecoes (
        ID INT PRIMARY KEY IDENTITY(1,1),
        CampanhaID INT FOREIGN KEY REFERENCES Campanhas(ID),
        Nome VARCHAR(200) NOT NULL,
        Descricao TEXT,
        CriadoPor INT,
        DataCriacao DATETIME DEFAULT GETDATE(),
        DataAtualizacao DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('Tabela Colecoes ok.');

    // Criar Produtos (Os itens de checklist dentro do card)
    await dbLocal.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Produtos' and xtype='U')
      CREATE TABLE Produtos (
        ID INT PRIMARY KEY IDENTITY(1,1),
        ColecaoID INT FOREIGN KEY REFERENCES Colecoes(ID) ON DELETE CASCADE,
        Nome VARCHAR(200) NOT NULL,
        StatusAtual VARCHAR(50) DEFAULT 'Rascunho',
        FaseAtual VARCHAR(50) DEFAULT 'DESIGN',
        ReferenciaERP VARCHAR(50) NULL,
        DataCriacao DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('Tabela Produtos ok.');

    // Anexos da Coleção / Produto
    await dbLocal.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Colecao_Anexos' and xtype='U')
      CREATE TABLE Colecao_Anexos (
        ID INT PRIMARY KEY IDENTITY(1,1),
        ColecaoID INT FOREIGN KEY REFERENCES Colecoes(ID) ON DELETE CASCADE,
        ProdutoID INT NULL FOREIGN KEY REFERENCES Produtos(ID) ON DELETE NO ACTION,
        CaminhoArquivo VARCHAR(500) NOT NULL,
        DataCriacao DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('Tabela Colecao_Anexos ok.');

    console.log('Migração V2 finalizada com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error('Erro na migração:', err);
    process.exit(1);
  }
}

migrate();
