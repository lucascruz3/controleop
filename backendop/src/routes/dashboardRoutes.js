const express = require('express');
const router = express.Router();
const poolERP = require('../config/dbErp');

router.get('/ops', async (req, res) => {
  try {
    const request = poolERP.request();
    
    const query = `
      select distinct
      LEFT(nops, 5) as PEDIDO,
      a.nops as OP,
      c.cpros as PRODUTO,
      c.codcors as COR,
      c.codtams as TAMANHO,
      d.dpros as DESCRICAO,
      d.colecoes as COLECAO,
      d.codscols as SUBCOLECAO,
      c.qtds as QUANTIDADE,
      b.pesos as PESO,
      b.grupods as FASEATUAL,
      convert(varchar,b.DATAFASE,103) as DATAFASE,
      convert(varchar,e.DATAFASE,103) as DATAABERTURA,
      f.QUANTIDADESETOR as QUANTIDADESETOR,
      CASE
      WHEN c.cpros like 'CONS%' THEN 'CONSERTO'
      WHEN g.cmats is null and h.mats is not null THEN h.mats
      WHEN g.cmats is null and h.mats is null THEN 'SEMMATERIAL'
      WHEN g.cmats is not null THEN g.cmats
      END as MATERIAL
      from sljnens a
      outer apply(
        select top 1 grupods,pesos,datas as DATAFASE
        from sljmfas 
        where a.nops=sljmfas.nops 
        order by sljmfas.datas desc
      ) b
      outer apply(
        select top 1 cpros,codcors,codtams,qtds
        from sljopi 
        where a.nops=sljopi.nops 
        order by sljopi.nops desc
      ) c
      outer apply(
        select top 1 dpros,codscols,colecoes 
        from sljpro 
        where c.cpros=sljpro.cpros 
        order by sljpro.cpros desc
      ) d
      outer apply(
        select top 1 grupods,pesos,datas as DATAFASE
        from sljmfas 
        where a.nops=sljmfas.nops 
        order by sljmfas.datas asc
      ) e
      outer apply(
        select count(grupods) as QUANTIDADESETOR
        from sljmfas 
        where a.nops=sljmfas.nops and b.grupods=sljmfas.grupods
      ) f
      outer apply(
        select top 1 cmats from sljnensi where nops=a.nops and cunis='GR' and (cmats like '%AU%' or cmats like '%AG%' or cmats like '%BRONZE%') order by cmats
      ) g
      outer apply(
        select mats from sljcompo where cpros=c.cpros and unicompos='GR' and mats in ('AU750','AG950','BRONZE')
      ) h
      where
        nops<>'0' and 
        datas>='01/01/2024' and 
        b.grupods not in ('556ESTOQUE','') and
        b.grupods not like '%P1 MERCADO%' and
        d.colecoes not like '%P1 MERCADO%' and
        d.codscols not like '%P1 MERCADO%' and
        c.cpros not like '%P1 MERCADO%' and
        LEFT(nops, 5) NOT IN ('14641')
      order by b.grupods
    `;

    const result = await request.query(query);
    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    return res.status(500).json({ message: 'Erro interno ao buscar dados do ERP.' });
  }
});

module.exports = router;
