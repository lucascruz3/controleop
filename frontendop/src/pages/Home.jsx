import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { Bell, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import './Home.css';

export function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('@controloop:user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchNotificacoes();
  }, []);

  const fetchNotificacoes = async () => {
    try {
      const token = localStorage.getItem('@controloop:token');
      if (!token) return;
      const res = await axios.get('http://localhost:3003/api/notificacoes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotificacoes(res.data);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificacaoClick = async (notificacao) => {
    try {
      const token = localStorage.getItem('@controloop:token');
      await axios.put(`http://localhost:3003/api/notificacoes/${notificacao.ID}/ler`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Após marcar como lido, redireciona pro projeto
      navigate(`/pre-producao/${notificacao.ProjetoID}`);
    } catch (error) {
      console.error('Erro ao ler notificação:', error);
    }
  };

  return (
    <Layout>
      <div className="home-container">
        <header className="home-header">
          <div className="header-content">
            <h1>Olá, {user?.nome || 'Usuário'}</h1>
            <p className="subtitle">Aqui estão as suas pendências e novidades do sistema.</p>
          </div>
        </header>

        <div className="dashboard-grid">
          <section className="notifications-section">
            <div className="section-title">
              <div className="title-icon">
                <Bell size={18} />
              </div>
              <h2>Atividades Recentes & Pendências</h2>
            </div>

            {loading ? (
              <div className="loading-state">Carregando informações...</div>
            ) : notificacoes.length === 0 ? (
              <div className="empty-state">
                <CheckCircle2 size={48} className="empty-icon" />
                <h3>Tudo limpo!</h3>
                <p>Você não possui nenhuma pendência no momento.</p>
              </div>
            ) : (
              <div className="notifications-list">
                {notificacoes.map(notif => (
                  <div 
                    key={notif.ID} 
                    className={`notification-card ${notif.Lida ? 'lida' : 'nao-lida'}`}
                    onClick={() => handleNotificacaoClick(notif)}
                  >
                    <div className="notif-icon">
                      {!notif.Lida ? <span className="dot-unread"></span> : <Clock size={16} />}
                    </div>
                    <div className="notif-content">
                      <div className="notif-header">
                        <h4>{notif.NomeProjeto}</h4>
                        <span className="notif-date">
                          {new Date(notif.DataCriacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p>{notif.Mensagem}</p>
                    </div>
                    <div className="notif-action">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}
