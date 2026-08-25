import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      
      const response = await fetch('http://localhost:3003/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Credenciais inválidas');
      }

      // Salva o token ou dados do usuário no localStorage
      localStorage.setItem('@controloop:user', JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem('@controloop:token', data.token);
      }

      console.log('Login realizado com sucesso:', data);
      
      // Redireciona para a tela principal (dashboard)
      navigate('/dashboard');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">

        {/* LADO ESQUERDO */}
        <div className="login-form-section">
          <div className="login-content">

            <div className="login-badge">
              <span className="badge-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              Acesso Seguro
            </div>

            <h1>Bem-vindo</h1>
            <p className="login-subtitle">Entre com suas credenciais para continuar.</p>

            <form onSubmit={handleSubmit}>
              
              {/* Mostra mensagem de erro caso exista */}
              {error && (
                <div style={{ color: 'red', marginBottom: '1rem', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '5px', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              <div className="input-group">
                <label htmlFor="username">Usuário</label>
                <input
                  id="username"
                  type="text"
                  placeholder="Seu usuário"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">Senha</label>
                <div className="password-container">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="******"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.5 4 9.5 6-.4.8-1.2 2-2.5 3.1" />
                        <path d="M6.1 6.1C3.9 7.5 2.7 9.3 2.5 10c1 2 4.5 6 9.5 6 1 0 1.9-.2 2.7-.5" />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                <span>{loading ? 'Acessando...' : 'Acessar Plataforma'}</span>
                {!loading && (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                )}
              </button>
            </form>

            <div className="login-footer">
              Controle de Produção &copy; {new Date().getFullYear()}
            </div>
          </div>
        </div>

        {/* LADO DIREITO */}
        <div className="login-brand-section">
          <div className="brand-content">
            <div className="brand-icon">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>

            <h2>
              Controle<br />
              de Produção
            </h2>

            <div className="brand-line"></div>
          </div>

          <div className="decorative-chart">
            <div className="chart-bar bar-1"></div>
            <div className="chart-bar bar-2"></div>
            <div className="chart-bar bar-3"></div>
            <div className="chart-bar bar-4"></div>
            <div className="chart-bar bar-5"></div>
            <div className="chart-bar bar-6"></div>
            <div className="chart-bar bar-7"></div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;