import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { ArrowLeft, Send, Paperclip, Check, XCircle } from 'lucide-react';
import axios from 'axios';
import './ProjetoDetail.css';

export function ProjetoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [projeto, setProjeto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState('');
  const [file, setFile] = useState(null);
  const chatEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('@controloop:user') || '{}');

  useEffect(() => {
    fetchProjetoDetalhes();
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [projeto?.historico]);

  const fetchProjetoDetalhes = async () => {
    try {
      const token = localStorage.getItem('@controloop:token');
      const res = await axios.get(`http://localhost:3003/api/projetos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjeto(res.data);
    } catch (error) {
      console.error('Erro ao buscar detalhes do projeto', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!mensagem.trim() && !file) return;

    try {
      const token = localStorage.getItem('@controloop:token');
      
      // 1. Enviar mensagem
      let historicoId = null;
      if (mensagem.trim()) {
        const resMsg = await axios.post(`http://localhost:3003/api/projetos/${id}/historico`, {
          mensagem
        }, { headers: { Authorization: `Bearer ${token}` } });
        historicoId = resMsg.data.id;
      }

      // 2. Enviar arquivo se houver
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        if (historicoId) formData.append('historicoId', historicoId);
        formData.append('faseInsercao', projeto.FaseAtual);

        await axios.post(`http://localhost:3003/api/projetos/${id}/anexo`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        // Se não tinha mensagem mas mandou foto, registra no histórico que enviou foto
        if (!historicoId) {
           await axios.post(`http://localhost:3003/api/projetos/${id}/historico`, {
            mensagem: 'Enviou um anexo.'
          }, { headers: { Authorization: `Bearer ${token}` } });
        }
      }

      setMensagem('');
      setFile(null);
      fetchProjetoDetalhes(); // Recarrega
    } catch (error) {
      console.error('Erro ao enviar', error);
      alert('Erro ao enviar mensagem/anexo.');
    }
  };

  const handleChangeStatus = async (novoStatus, novaFase) => {
    try {
      const token = localStorage.getItem('@controloop:token');
      let msg = `Alterou o status para: ${novoStatus}`;
      if (novaFase) msg += ` (Enviado para ${novaFase})`;

      await axios.post(`http://localhost:3003/api/projetos/${id}/historico`, {
        mensagem: msg,
        novoStatus: novoStatus,
        novaFase: novaFase
      }, { headers: { Authorization: `Bearer ${token}` } });

      fetchProjetoDetalhes();
    } catch (error) {
      console.error('Erro ao alterar status', error);
    }
  };

  if (loading) return <Layout><div style={{ color: '#fff', padding: '20px' }}>Carregando...</div></Layout>;
  if (!projeto) return <Layout><div style={{ color: '#fff', padding: '20px' }}>Projeto não encontrado.</div></Layout>;

  return (
    <Layout>
      <div className="detail-container">
        {/* Lado Esquerdo - Info e Status */}
        <div className="project-sidebar">
          <button className="btn-back" onClick={() => navigate('/pre-producao')}>
            <ArrowLeft size={16} /> Voltar ao Kanban
          </button>
          
          <div className="project-info-card">
            <h2>{projeto.Nome}</h2>
            <span className={`badge-fase ${projeto.FaseAtual.toLowerCase()}`}>{projeto.FaseAtual}</span>
            <span className="badge-status">{projeto.StatusAtual}</span>
            
            <div className="info-group">
              <label>Descrição / Briefing:</label>
              <p>{projeto.Descricao || 'Nenhuma descrição fornecida.'}</p>
            </div>
            
            <div className="info-group">
              <label>Código ERP:</label>
              {projeto.ReferenciaERP ? (
                <p style={{ fontWeight: 'bold', color: '#10b981' }}>{projeto.ReferenciaERP}</p>
              ) : (
                projeto.FaseAtual === 'MODELAGEM' && (user.acesso === 'MODELISTA' || user.acesso === 'admin') ? (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <input 
                      type="text" 
                      id="erp-input"
                      placeholder="Ex: AN-10293"
                      style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #333', background: '#262a33', color: '#fff' }}
                    />
                    <button 
                      onClick={async () => {
                        const val = document.getElementById('erp-input').value;
                        if (!val) return;
                        try {
                          const token = localStorage.getItem('@controloop:token');
                          await axios.put(`http://localhost:3003/api/projetos/${id}/erp`, { referenciaERP: val }, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          fetchProjetoDetalhes();
                        } catch (err) { alert('Erro ao salvar ERP'); }
                      }}
                      style={{ padding: '0.4rem 0.8rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Salvar
                    </button>
                  </div>
                ) : (
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    Aguardando liberação para Modelagem...
                  </p>
                )
              )}
            </div>

            {/* Ações de Aprovação (Visíveis dependendo da role) */}
            <div className="action-buttons">
              {(user.acesso === 'DIRETOR' || user.acesso === 'admin') && projeto.StatusAtual.includes('Aguardando') && (
                <>
                  <button className="btn-approve" onClick={() => handleChangeStatus('Aprovado', 'MODELAGEM')}>
                    <Check size={16} /> Aprovar Escopo
                  </button>
                  <button className="btn-reject" onClick={() => handleChangeStatus('Ajustes Solicitados')}>
                    <XCircle size={16} /> Pedir Ajustes
                  </button>
                </>
              )}

              {/* Botões para Designer/Modelista submeterem para aprovação */}
              {((user.acesso === 'DESIGNER' && projeto.FaseAtual === 'DESIGN') || 
                (user.acesso === 'MODELISTA' && projeto.FaseAtual === 'MODELAGEM')) && (
                <button className="btn-submit-approval" onClick={() => handleChangeStatus('Aguardando Aprovação do Diretor')}>
                  Enviar para Aprovação
                </button>
              )}
            </div>
          </div>

          {/* Galeria de Anexos Rápidos */}
          <div className="attachments-card">
            <h3>Arquivos Anexados</h3>
            <div className="gallery-grid">
              {projeto.anexos?.length === 0 && <p className="text-muted">Nenhum anexo ainda.</p>}
              {projeto.anexos?.map(a => (
                <a key={a.ID} href={`http://localhost:3003/${a.CaminhoArquivo}`} target="_blank" rel="noreferrer" className="gallery-item">
                  <img src={`http://localhost:3003/${a.CaminhoArquivo}`} alt="Anexo" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Lado Direito - Chat */}
        <div className="project-chat">
          <div className="chat-header">
            <h3>Histórico e Discussão</h3>
          </div>
          
          <div className="chat-messages">
            {projeto.historico?.map(hist => (
              <div key={hist.ID} className={`chat-bubble ${hist.UsuarioID === user.id ? 'me' : 'other'} ${hist.MudancaDeStatus ? 'system-msg' : ''}`}>
                <div className="chat-meta">
                  <strong>{hist.NomeUsuario}</strong> • {new Date(hist.DataCriacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="chat-text">
                  {hist.Mensagem}
                </div>
                {/* Se essa mensagem teve um anexo linkado */}
                {projeto.anexos?.find(a => a.HistoricoID === hist.ID) && (
                  <div className="chat-attachment">
                    <img src={`http://localhost:3003/${projeto.anexos.find(a => a.HistoricoID === hist.ID).CaminhoArquivo}`} alt="Anexo" />
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={handleSendMessage}>
            {file && (
              <div className="file-preview">
                <Paperclip size={14} /> {file.name} 
                <button type="button" onClick={() => setFile(null)}><XCircle size={14} /></button>
              </div>
            )}
            <div className="input-row">
              <label className="btn-attach">
                <Paperclip size={20} />
                <input type="file" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} accept="image/*" />
              </label>
              <input 
                type="text" 
                placeholder="Escreva um comentário ou solicite ajuste..." 
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
              />
              <button type="submit" className="btn-send"><Send size={20} /></button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
