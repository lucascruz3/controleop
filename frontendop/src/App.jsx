import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import Dashboard from './pages/Dashboard';
import { Register } from './pages/Register';

import { Home } from './pages/Home';
import { PreProducao } from './pages/PreProducao';
import { ProjetoDetail } from './pages/ProjetoDetail';
import { CriarColecao } from './pages/CriarColecao';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/pre-producao" element={<PreProducao />} />
        <Route path="/nova-colecao" element={<CriarColecao />} />
        <Route path="/pre-producao/:id" element={<ProjetoDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register" element={<Register />} />
        {/* Rota coringa pra redirecionar pro login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;