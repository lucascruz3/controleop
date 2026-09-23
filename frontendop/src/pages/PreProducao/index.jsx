import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Palette, Box, User, Calendar, Tag, ChevronRight, Sparkles } from 'lucide-react';
import './PreProducao.css';

export function PreProducao() {
  const navigate = useNavigate();
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('@controloop:user');
    if (storedUser) setUser(JSON.parse(storedUser));
    
    fetchProjetos();
  }, []);

  const fetchProjetos = async () => {
    try {
      const token = localStorage.getItem('@controloop:token');
      const res = await axios.get('http://localhost:3003/api/projetos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjetos(res.data);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Amostras de capas e peças de joalheria para demonstração visual
  const SAMPLE_COVERS = [
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80', // Anel Solitário Diamante
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80', // Colar Esmeralda & Ouro
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80', // Joias Ouro Nobre Minimalistas
    'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80', // Brincos Gota Diamante
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80', // Conjunto Safira & Ouro Branco
  ];

  const SAMPLE_PIECES = [
    [
      { nome: 'Anel Solitário 18k', imagem: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=240&q=80' },
      { nome: 'Brinco Ponto de Luz', imagem: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=240&q=80' },
      { nome: 'Pingente Gota Diamante', imagem: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=240&q=80' },
      { nome: 'Aliança Cravejada', imagem: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=240&q=80' },
    ],
    [
      { nome: 'Gargantilha Esmeralda', imagem: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=240&q=80' },
      { nome: 'Brinco Esmeralda Gota', imagem: 'https://images.unsplash.com/photo-1611591475887-f2756850fa9d?auto=format&fit=crop&w=240&q=80' },
      { nome: 'Anel Cocktail Gema', imagem: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=240&q=80' },
      { nome: 'Pulseira Riviera', imagem: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=240&q=80' },
      { nome: 'Pingente Oval', imagem: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=240&q=80' },
    ],
    [
      { nome: 'Argola Diamantada', imagem: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=240&q=80' },
      { nome: 'Corrente Ouro Veneziana', imagem: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=240&q=80' },
      { nome: 'Anel Pavê Diamantes', imagem: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=240&q=80' },
    ]
  ];

  // Helper para imagem da capa (usa imagem real ou amostra de joia para visualização)
  const getCoverImage = (p, index = 0) => {
    const imgName = p.ImagemCapa || p.CaminhoImagem || p.Imagem;
    if (imgName) {
      return imgName.startsWith('http') ? imgName : `http://localhost:3003/uploads/${imgName}`;
    }
    // Retorna foto de joia de alta definição para demonstração
    const sampleIdx = Math.abs((p.ID || index || 0)) % SAMPLE_COVERS.length;
    return SAMPLE_COVERS[sampleIdx];
  };

  // Helper para obter produtos da coleção (reais ou amostras ilustrativas)
  const getCollectionProducts = (p, index = 0) => {
    if (p.Produtos && Array.isArray(p.Produtos) && p.Produtos.length > 0) {
      return p.Produtos.map(prod => ({
        nome: prod.Nome || prod.nome,
        imagem: prod.Imagem ? (prod.Imagem.startsWith('http') ? prod.Imagem : `http://localhost:3003/uploads/${prod.Imagem}`) : SAMPLE_COVERS[0]
      }));
    }
    const sampleIdx = Math.abs((p.ID || index || 0)) % SAMPLE_PIECES.length;
    return SAMPLE_PIECES[sampleIdx];
  };

  // Helper para tipo de status
  const getStatusBadgeType = (status) => {
    if (!status) return 'default';
    const s = status.toLowerCase();
    if (s.includes('aguardando') || s.includes('pendente') || s.includes('revisão')) return 'warning';
    if (s.includes('aprovado') || s.includes('concluído') || s.includes('finalizado')) return 'success';
    if (s.includes('ajuste') || s.includes('rejeitado') || s.includes('alteração')) return 'danger';
    return 'info';
  };

  // Separa os projetos em colunas
  const colunas = {
    'DESIGN': projetos.filter(p => p.FaseAtual === 'DESIGN' && !p.StatusAtual.includes('Aguardando')),
    'DIRETOR': projetos.filter(p => p.StatusAtual.includes('Aguardando') || p.FaseAtual === 'DIRETOR'),
    'MODELAGEM': projetos.filter(p => p.FaseAtual === 'MODELAGEM')
  };

  const renderCard = (p, index = 0) => {
    const coverUrl = getCoverImage(p, index);
    const produtos = getCollectionProducts(p, index);
    const badgeType = getStatusBadgeType(p.StatusAtual);

    return (
      <div 
        key={p.ID} 
        className="luxury-card"
        onClick={() => navigate(`/pre-producao/${p.ID}`)}
      >
        {/* Cover Section */}
        <div className="card-cover-wrapper">
          <div 
            className="card-cover-img" 
            style={{ backgroundImage: `url(${coverUrl})` }}
          />

          {/* Floating Glass Status Badge */}
          <div className="card-floating-badge">
            <span className={`status-pill pill-${badgeType}`}>
              <span className="status-dot" />
              {p.StatusAtual}
            </span>
          </div>

          {/* Bottom shadow overlay for smooth transition */}
          <div className="cover-shadow-overlay" />
        </div>

        {/* Card Body */}
        <div className="card-body-content">
          <div className="card-title-row">
            <h4 className="card-title">{p.Nome}</h4>
            <ChevronRight size={18} className="card-arrow-icon" />
          </div>

          {p.ReferenciaERP && (
            <div className="erp-tag">
              <Tag size={12} />
              <span>ERP: {p.ReferenciaERP}</span>
            </div>
          )}

          {/* Miniaturas das Peças da Coleção */}
          <div className="collection-pieces-section">
            <div className="pieces-header">
              <span className="pieces-title">Peças da Coleção</span>
              <span className="pieces-count-pill">{produtos.length} {produtos.length === 1 ? 'item' : 'itens'}</span>
            </div>

            <div className="pieces-gallery-row">
              {produtos.slice(0, 4).map((item, idx) => (
                <div 
                  key={idx} 
                  className="piece-thumb-container"
                  title={item.nome}
                  onClick={(e) => e.stopPropagation()}
                >
                  <img 
                    src={item.imagem} 
                    alt={item.nome} 
                    className="piece-thumb-img" 
                    loading="lazy"
                  />
                </div>
              ))}
              {produtos.length > 4 && (
                <div className="piece-thumb-container piece-more-badge">
                  <span>+{produtos.length - 4}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card-divider" />

          {/* Footer Metadata */}
          <div className="card-meta-footer">
            <div className="meta-author">
              <div className="author-avatar">
                {p.NomeCriador ? p.NomeCriador.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="author-name">{p.NomeCriador || 'Design Team'}</span>
            </div>

            <div className="meta-date">
              <Calendar size={13} />
              <span>{p.DataAtualizacao ? new Date(p.DataAtualizacao).toLocaleDateString('pt-BR') : 'Recente'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="kanban-container">
        {/* Header Elegante */}
        <div className="kanban-header">
          <div className="kanban-header-titles">
            <div className="header-badge">
              <Sparkles size={14} /> Fluxo de Coleções
            </div>
            <h1>Gestão de Projetos</h1>
            <p>Acompanhe o desenvolvimento, aprovação e modelagem das peças exclusivas</p>
          </div>

          {(user?.acesso === 'DESIGNER' || user?.acesso === 'admin') && (
            <button className="btn-create-luxury" onClick={() => navigate('/nova-colecao')}>
              <Plus size={18} /> Novo Projeto
            </button>
          )}
        </div>

        {loading ? (
          <div className="kanban-loading">
            <div className="loading-spinner" />
            <span>Carregando coleções...</span>
          </div>
        ) : (
          <div className="kanban-board">
            {/* Coluna DESIGN */}
            <div className="kanban-column">
              <div className="column-header design-header">
                <div className="col-title-group">
                  <div className="col-icon-box design-icon">
                    <Palette size={16} />
                  </div>
                  <h3>Design & Criação</h3>
                </div>
                <span className="count-pill">{colunas['DESIGN'].length}</span>
              </div>
              <div className="column-body">
                {colunas['DESIGN'].length === 0 ? (
                  <div className="empty-column-msg">Nenhum projeto em Design</div>
                ) : (
                  colunas['DESIGN'].map((p, idx) => renderCard(p, idx))
                )}
              </div>
            </div>

            {/* Coluna SR MILTON (Diretoria) */}
            <div className="kanban-column">
              <div className="column-header diretor-header">
                <div className="col-title-group">
                  <div className="col-icon-box diretor-icon">
                    <User size={16} />
                  </div>
                  <h3>Aprovação Diretoria</h3>
                </div>
                <span className="count-pill">{colunas['DIRETOR'].length}</span>
              </div>
              <div className="column-body">
                {colunas['DIRETOR'].length === 0 ? (
                  <div className="empty-column-msg">Nenhum projeto aguardando aprovação</div>
                ) : (
                  colunas['DIRETOR'].map((p, idx) => renderCard(p, idx + 1))
                )}
              </div>
            </div>

            {/* Coluna MODELAGEM 3D */}
            <div className="kanban-column">
              <div className="column-header modelagem-header">
                <div className="col-title-group">
                  <div className="col-icon-box modelagem-icon">
                    <Box size={16} />
                  </div>
                  <h3>Modelagem 3D</h3>
                </div>
                <span className="count-pill">{colunas['MODELAGEM'].length}</span>
              </div>
              <div className="column-body">
                {colunas['MODELAGEM'].length === 0 ? (
                  <div className="empty-column-msg">Nenhum projeto em Modelagem</div>
                ) : (
                  colunas['MODELAGEM'].map((p, idx) => renderCard(p, idx + 2))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
