import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './Register.css';

export function Register() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [acesso, setAcesso] = useState('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica se é admin, se não for volta pro dashboard
    const user = JSON.parse(localStorage.getItem('@controloop:user') || '{}');
    if (!user || user.acesso !== 'admin') {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3003/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha, acesso }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao cadastrar usuário');
      }

      setSuccess('Usuário cadastrado com sucesso!');
      setNome('');
      setEmail('');
      setSenha('');
      setAcesso('user');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        
        <div className="register-header">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={20} /> Voltar
          </button>
          <h2>Cadastrar Novo Usuário</h2>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {error && <div className="register-alert error">{error}</div>}
          {success && <div className="register-alert success">{success}</div>}

          <div className="input-group">
            <label htmlFor="nome">Nome</label>
            <input
              id="nome"
              type="text"
              placeholder="Nome do usuário"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="exemplo@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              placeholder="******"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="acesso">Nível de Acesso</label>
            <select
              id="acesso"
              value={acesso}
              onChange={(e) => setAcesso(e.target.value)}
            >
              <option value="user">Usuário Comum</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar Usuário'}
          </button>
        </form>

      </div>
    </div>
  );
}

export default Register;
