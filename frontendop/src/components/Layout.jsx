import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Home, LayoutDashboard, FolderKanban, FolderPlus, LogOut, Menu, X } from 'lucide-react';
import './Layout.css';
import axios from 'axios';

export function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Busca usuário no localStorage
    const storedUser = localStorage.getItem('@controloop:user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Busca notificações
    fetchNotificacoes();
  }, []);

  const fetchNotificacoes = async () => {
    try {
      const token = localStorage.getItem('@controloop:token');
      if (!token) return;
      const response = await axios.get('http://localhost:3003/api/notificacoes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const unread = response.data.filter(n => n.Lida === false || n.Lida === 0).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Erro ao buscar notificações', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('@controloop:token');
    localStorage.removeItem('@controloop:user');
    navigate('/');
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleNavigation = (path) => {
    navigate(path);
    closeMenu();
  };

  return (
    <div className="layout-container">
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-left">
          <button className="menu-toggle-btn" onClick={toggleMenu}>
            <Menu size={24} />
          </button>
        </div>
        
        <div className="topbar-logo">Controle OP</div>

        <div className="topbar-actions">
          <div className="notification-bell" onClick={() => alert('Central de notificações em breve!')}>
            <Bell size={24} />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </div>
          <button className="logout-btn-desktop" onClick={handleLogout}>
            <LogOut size={20} /> Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>

      {/* Overlay */}
      {isMenuOpen && <div className="menu-overlay" onClick={closeMenu}></div>}

      {/* Lateral Modal Menu */}
      <nav className={`side-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="side-menu-header">
          <span className="menu-title">Menu</span>
          <button className="close-menu-btn" onClick={closeMenu}>
            <X size={24} />
          </button>
        </div>
        
        <div className="side-menu-content">
          <div 
            className={`nav-item ${location.pathname === '/home' ? 'active' : ''}`}
            onClick={() => handleNavigation('/home')}
          >
            <Home size={24} />
            <span>Início</span>
          </div>
          <div 
            className={`nav-item ${location.pathname === '/pre-producao' ? 'active' : ''}`}
            onClick={() => handleNavigation('/pre-producao')}
          >
            <FolderKanban size={24} />
            <span>Pré-Produção</span>
          </div>
          <div 
            className={`nav-item ${location.pathname === '/nova-colecao' ? 'active' : ''}`}
            onClick={() => handleNavigation('/nova-colecao')}
          >
            <FolderPlus size={24} />
            <span>Criar Coleção</span>
          </div>
          <div 
            className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
            onClick={() => handleNavigation('/dashboard')}
          >
            <LayoutDashboard size={24} />
            <span>Fábrica</span>
          </div>
        </div>
        
        <div className="side-menu-footer">
          <div className="nav-item logout-item" onClick={handleLogout}>
            <LogOut size={24} />
            <span>Sair</span>
          </div>
        </div>
      </nav>
    </div>
  );
}
