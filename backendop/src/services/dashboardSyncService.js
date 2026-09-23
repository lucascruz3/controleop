const poolERP = require('../config/dbErp');
const poolLocal = require('../config/dbLocal');
const sql = require('mssql');

const syncDashboardData = async () => {
  try {
    console.log('Iniciando sincronização dos dados do ERP para o banco local...');
    
    // 1. Buscar os dados do ERP
    const requestERP = poolERP.request();
    const queryERP = `
      SELECT DISTINCT
        LEFT(a.nops, 5)                         AS PEDIDO,
        a.nops                                  AS OP,
        c.cpros                                 AS PRODUTO,
        c.codcors                               AS COR,
        c.codtams                               AS TAMANHO,
        d.dpros                                 AS DESCRICAO,
        d.colecoes                              AS COLECAO,
        d.codscols                              AS SUBCOLECAO,
        c.qtds                                  AS QUANTIDADE,
        b.pesos                                 AS PESO,
        CASE b.grupods
            WHEN '556ESTOQUE' THEN 'ENCERRADO'
            WHEN 'P1 ACABAM'  THEN 'ACABAMENTO'
            WHEN 'P1 CRAVAC'  THEN 'CRAVACAO'
            WHEN 'P1 FUNDICA' THEN 'FUNDICAO'
            WHEN 'P1 INICIO'  THEN 'INICIO'
            WHEN 'P1 MONTAG'  THEN 'MONTAGEM'
            WHEN 'P1 OFICINA' THEN 'OFICINA'
            WHEN 'P1 PENDENC' THEN 'PENDENCIA'
            WHEN 'P1 POLFINA' THEN 'POL. FINAL'
            WHEN 'P1 POLMEC'  THEN 'POL. MEC'
            WHEN 'P1 PREPOL'  THEN 'PRE POL'
            WHEN 'P1 QUALIDA' THEN 'QUALIDADE'
            WHEN 'P1 PRECRAV' THEN 'PRECRAV'
            WHEN 'P1 ACAB EX' THEN 'ACAB. EXT'
            WHEN 'P1 AGR.TAR' THEN 'AGR.TAR'
            WHEN 'P1 DES.COR' THEN 'DES.COR'
            WHEN 'P1 CUNHAGE' THEN 'CUNHAGE'
            WHEN 'P0 PR.PROT' THEN 'PR.PROT'
            WHEN 'P1 RHODIO'  THEN 'RHODIO'
            WHEN 'P1 REAQUIM' THEN 'REAQUIM'
            WHEN 'P0 ACM.DES' THEN 'ACM.DES'
            WHEN 'P1 CRV EXT' THEN 'CRV EXT'
            WHEN 'P1 CRAV ME' THEN 'CRAV ME'
            WHEN 'P1 MERCADO' THEN 'ENCERRADO'
            WHEN 'P1 MATERIA' THEN 'MATERIA'
            WHEN 'P0 PR.PRE'  THEN 'PR.PRE'
            WHEN 'P0 MON.DES' THEN 'MON.DES'
            WHEN 'CLIENTE'    THEN 'CLIENTE'
            WHEN 'P1 SELEÇÃO' THEN 'SELECAO'
            WHEN 'P1 RE CRAV' THEN 'RE CRAV'
            WHEN 'P1 MODELAG' THEN 'MODELAG'
            WHEN 'P1 INJETOR' THEN 'INJETO'
            WHEN 'P0 FUND.DE' THEN 'FUND.DE'
            WHEN 'P1 PREPMAT' THEN 'PREMAT'
            WHEN 'P0 BORRACH' THEN 'BORRACHA'
            WHEN 'P1 ANALISE' THEN 'ANALISE'
            WHEN 'P1 TURBO'   THEN 'TURBO'
            WHEN 'P1 CRCEREX' THEN 'CRCEREX'
            WHEN 'P0 MODELIS' THEN 'MODELIS'
            WHEN 'P1 LXGITO'  THEN 'LXGITO'
            WHEN 'P1 COLAGEM' THEN 'COLAGEM'
            WHEN 'P1 DES.TAR' THEN 'DES.TAR'
            WHEN 'P0 INJ.DES' THEN 'INJ.DES'
            WHEN 'P1 MONT EX' THEN 'MONT EX'
            WHEN 'P1 LIMCERA' THEN 'LIMCERA'
            WHEN 'P1 OTEC'    THEN 'OTEC'
            WHEN 'P1 MAGNET'  THEN 'MAGNET'
            WHEN 'P1 AGR.COR' THEN 'AGR.COR'
            WHEN 'P1 POL.EXT' THEN 'POL.EXT'
            WHEN 'P0 ACA.RES' THEN 'ACA.RES'
            WHEN 'P1 CONSERT' THEN 'CONSERTO'
            WHEN 'P1 PROTOT'  THEN 'PROTOTIPAGEM'
            ELSE b.grupods
        END                                     AS FASEATUAL,
        CONVERT(VARCHAR(10), b.DATAFASE, 103)   AS DATAFASE,
        CONVERT(VARCHAR(10), e.DATAFASE, 103)   AS DATAABERTURA,
        f.QUANTIDADESETOR                       AS QUANTIDADESETOR,
        CASE 
            WHEN c.cpros LIKE 'CONS%' THEN 'CONSERTO'
            WHEN g.cmats IS NOT NULL  THEN g.cmats
            WHEN h.mats IS NOT NULL   THEN h.mats
            ELSE 'SEMMATERIAL'
        END                                     AS MATERIAL
    FROM sljnens a
    OUTER APPLY ( SELECT TOP 1 sljmfas.grupods, sljmfas.pesos, sljmfas.datas AS DATAFASE FROM sljmfas WHERE a.nops = sljmfas.nops ORDER BY sljmfas.datas DESC ) b
    OUTER APPLY ( SELECT TOP 1 sljopi.cpros, sljopi.codcors, sljopi.codtams, sljopi.qtds FROM sljopi WHERE a.nops = sljopi.nops ORDER BY sljopi.nops DESC ) c
    OUTER APPLY ( SELECT TOP 1 sljpro.dpros, sljpro.codscols, sljpro.colecoes FROM sljpro WHERE c.cpros = sljpro.cpros ORDER BY sljpro.cpros DESC ) d
    OUTER APPLY ( SELECT TOP 1 sljmfas.grupods, sljmfas.pesos, sljmfas.datas AS DATAFASE FROM sljmfas WHERE a.nops = sljmfas.nops ORDER BY sljmfas.datas ASC ) e
    OUTER APPLY ( SELECT COUNT(sljmfas.grupods) AS QUANTIDADESETOR FROM sljmfas WHERE a.nops = sljmfas.nops AND b.grupods = sljmfas.grupods ) f
    OUTER APPLY ( SELECT TOP 1 sljnensi.cmats FROM sljnensi WHERE sljnensi.nops = a.nops AND sljnensi.cunis = 'GR' AND (sljnensi.cmats LIKE '%AU%' OR sljnensi.cmats LIKE '%AG%' OR sljnensi.cmats LIKE '%BRONZE%') ORDER BY sljnensi.cmats ) g
    OUTER APPLY ( SELECT sljcompo.mats FROM sljcompo WHERE sljcompo.cpros = c.cpros AND sljcompo.unicompos = 'GR' AND sljcompo.mats IN ('AU750', 'AG950', 'BRONZE') ) h
    WHERE a.nops <> '0'
      AND a.datas >= '20240101'
      AND NULLIF(LTRIM(RTRIM(b.grupods)), '') IS NOT NULL
      AND LEFT(a.nops, 5) >= '15088'
    ORDER BY FASEATUAL;
    `;
    
    const resultERP = await requestERP.query(queryERP);
    const rows = resultERP.recordset;
    
    if (rows.length === 0) {
      console.log('Nenhum dado encontrado no ERP para sincronizar.');
      return;
    }

    console.log(`Encontrados ${rows.length} registros no ERP. Inserindo no banco local...`);

    // 2. Limpar a tabela local Dashboard antes de inserir os novos dados
    // TRUNCATE TABLE limpa a tabela rapidamente e reseta o IDENTITY(1,1)
    await poolLocal.request().query('TRUNCATE TABLE Dashboard');

    // 3. Preparar Bulk Insert
    const table = new sql.Table('Dashboard');
    table.create = false; // Tabela já existe

    table.columns.add('pedido', sql.VarChar(10), { nullable: true });
    table.columns.add('op', sql.VarChar(50), { nullable: true });
    table.columns.add('produto', sql.VarChar(100), { nullable: true });
    table.columns.add('cor', sql.VarChar(50), { nullable: true });
    table.columns.add('tamanho', sql.VarChar(20), { nullable: true });
    table.columns.add('descricao', sql.VarChar(255), { nullable: true });
    table.columns.add('colecao', sql.VarChar(100), { nullable: true });
    table.columns.add('subcolecao', sql.VarChar(100), { nullable: true });
    table.columns.add('quantidade', sql.Decimal(18,2), { nullable: true });
    table.columns.add('peso', sql.Decimal(18,4), { nullable: true });
    table.columns.add('faseatual', sql.VarChar(50), { nullable: true });
    table.columns.add('datafase', sql.VarChar(10), { nullable: true });
    table.columns.add('dataabertura', sql.VarChar(10), { nullable: true });
    table.columns.add('quantidadesetor', sql.Int, { nullable: true });
    table.columns.add('material', sql.VarChar(100), { nullable: true });
    // DataImportacao será adicionada via DEFAULT na tabela e o ID via IDENTITY

    rows.forEach(row => {
      table.rows.add(
        row.PEDIDO != null ? String(row.PEDIDO) : null,
        row.OP != null ? String(row.OP) : null,
        row.PRODUTO != null ? String(row.PRODUTO) : null,
        row.COR != null ? String(row.COR) : null,
        row.TAMANHO != null ? String(row.TAMANHO) : null,
        row.DESCRICAO != null ? String(row.DESCRICAO) : null,
        row.COLECAO != null ? String(row.COLECAO) : null,
        row.SUBCOLECAO != null ? String(row.SUBCOLECAO) : null,
        row.QUANTIDADE,
        row.PESO,
        row.FASEATUAL != null ? String(row.FASEATUAL) : null,
        row.DATAFASE != null ? String(row.DATAFASE) : null,
        row.DATAABERTURA != null ? String(row.DATAABERTURA) : null,
        row.QUANTIDADESETOR,
        row.MATERIAL != null ? String(row.MATERIAL) : null
      );
    });

    const requestLocal = poolLocal.request();
    await requestLocal.bulk(table);

    console.log('Sincronização concluída com sucesso!');
    return { success: true, count: rows.length };

  } catch (error) {
    console.error('Erro durante a sincronização:', error);
    throw error;
  }
};

module.exports = {
  syncDashboardData
};
