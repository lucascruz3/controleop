import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, CheckCircle, Clock, PauseCircle, Box, ShieldCheck, 
  RefreshCw, Calendar, X, UserPlus
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import './dashboard.css';

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6', '#d946ef', '#84cc16',
  '#6366f1', '#22c55e', '#facc15', '#f43f5e', '#a855f7', '#0ea5e9', '#fb923c', '#2dd4bf', '#ec4899', '#a3e635',
  '#1d4ed8', '#047857', '#b45309', '#b91c1c', '#6d28d9', '#0e7490', '#c2410c', '#0f766e', '#a21caf', '#4d7c0f',
  '#93c5fd', '#6ee7b7', '#fde047', '#fca5a5', '#c4b5fd', '#67e8f9', '#fdba74', '#5eead4', '#fbcfe8', '#bef264'
];

const MATERIAL_COLORS = [
  '#FF8042', '#00C49F', '#FFBB28', '#0088FE', '#A28CF2', '#FF6699', '#20B2AA', '#F08080', '#90EE90', '#DDA0DD',
  '#F4A460', '#FFD700', '#40E0D0', '#FF69B4', '#CD5C5C', '#BA55D3', '#32CD32', '#4682B4', '#D2691E', '#87CEFA'
];
export function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Obtém usuário do localStorage para condicional de renderização
  const currentUser = JSON.parse(localStorage.getItem('@controloop:user') || '{}');

  // Estado do Modal
  const [modal, setModal] = useState({ isOpen: false, title: '', items: [] });

  // Estado dos Filtros
  const [filters, setFilters] = useState({
    dateStart: '',
    dateEnd: '',
    fases: [],
    colecoes: [],
    searchOP: '',
    pedido: ''
  });

  // Estado para visões salvas
  const [savedViews, setSavedViews] = useState([]);
  const [newViewName, setNewViewName] = useState('');

  // Estado para a tabela do modal
  const [modalSearch, setModalSearch] = useState('');
  const [modalSort, setModalSort] = useState({ key: null, direction: 'asc' });

  const openModal = (title, items) => {
    setModalSearch('');
    setModalSort({ key: null, direction: 'asc' });
    setModal({ isOpen: true, title, items });
  };

  const closeModal = () => setModal({ isOpen: false, title: '', items: [] });

  useEffect(() => {
    const user = localStorage.getItem('@controloop:user');
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();

    const loadedViews = localStorage.getItem('@controloop:savedViews');
    if (loadedViews) {
      try {
        setSavedViews(JSON.parse(loadedViews));
      } catch (e) {
        console.error('Erro ao carregar visões', e);
      }
    }
  }, [navigate]);

  const handleSaveView = () => {
    if (!newViewName.trim()) return;
    const newView = { name: newViewName.trim(), filters: { ...filters } };
    const updatedViews = [...savedViews, newView];
    setSavedViews(updatedViews);
    localStorage.setItem('@controloop:savedViews', JSON.stringify(updatedViews));
    setNewViewName('');
  };

  const handleLoadView = (view) => {
    setFilters(view.filters);
  };

  const handleDeleteView = (viewName) => {
    const updatedViews = savedViews.filter(v => v.name !== viewName);
    setSavedViews(updatedViews);
    localStorage.setItem('@controloop:savedViews', JSON.stringify(updatedViews));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3003/api/dashboard/ops');
      if (!response.ok) throw new Error('Erro ao buscar dados');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('@controloop:user');
    localStorage.removeItem('@controloop:token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <h2>Carregando dados da Produção...</h2>
      </div>
    );
  }

  const parseDateStr = (dateStr) => {
    if (!dateStr) return null;
    const str = String(dateStr);
    if (str.includes('/')) {
      const [day, month, year] = str.split(' ')[0].split('/');
      return new Date(`${year}-${month}-${day}T00:00:00`);
    }
    return new Date(str);
  };

  // Filtrar P1 MERCADO no frontend
  const filteredData = data.filter(d => 
    !String(d.FASEATUAL || '').includes('P1 MERCADO') && 
    !String(d.COLECAO || '').includes('P1 MERCADO') &&
    !String(d.SUBCOLECAO || '').includes('P1 MERCADO') &&
    !String(d.PRODUTO || '').includes('P1 MERCADO')
  );

  // Opções para o filtro
  const availableFases = Array.from(new Set(filteredData.map(d => String(d.FASEATUAL || 'NÃO DEFINIDA')))).sort();
  const availableColecoes = Array.from(new Set(filteredData.map(d => String(d.SUBCOLECAO || 'NÃO DEFINIDA')))).sort();
  const availablePedidos = Array.from(new Set(filteredData.map(d => String(d.PEDIDO || '')))).filter(p => p.trim() !== '').sort();

  // Aplicação dos filtros do Menu Lateral
  const displayData = filteredData.filter(d => {
    if (filters.searchOP && !String(d.OP || '').toLowerCase().includes(filters.searchOP.toLowerCase())) return false;
    if (filters.pedido && String(d.PEDIDO || '') !== filters.pedido) return false;
    
    if (filters.dateStart || filters.dateEnd) {
      const dDate = parseDateStr(d.DATAABERTURA);
      if (dDate) {
        if (filters.dateStart) {
          const filterStart = new Date(`${filters.dateStart}T00:00:00`);
          if (dDate < filterStart) return false;
        }
        if (filters.dateEnd) {
          const filterEnd = new Date(`${filters.dateEnd}T23:59:59`);
          if (dDate > filterEnd) return false;
        }
      }
    }

    if (filters.fases.length > 0 && !filters.fases.includes(String(d.FASEATUAL || 'NÃO DEFINIDA'))) return false;
    if (filters.colecoes.length > 0 && !filters.colecoes.includes(String(d.SUBCOLECAO || 'NÃO DEFINIDA'))) return false;

    return true;
  });

  // --- CALCULOS DE KPI ---
  const totalOPs = displayData.length;
  const totalPecas = displayData.reduce((acc, curr) => acc + Number(curr.QUANTIDADE || 0), 0);
  
  // Agrupar por fase (Qtd)
  const fasesCount = displayData.reduce((acc, curr) => {
    const fase = String(curr.FASEATUAL || 'NÃO DEFINIDA');
    if (!acc[fase]) acc[fase] = 0;
    acc[fase] += Number(curr.QUANTIDADE || 0); 
    return acc;
  }, {});
  
  const pieData = Object.keys(fasesCount).map(key => {
    const totalPecasSafe = totalPecas || 1; // previne NaN se totalPecas for 0
    const percentage = ((fasesCount[key] / totalPecasSafe) * 100).toFixed(1);
    return { name: `${key} - ${percentage}%`, originalName: key, value: fasesCount[key], percentage: Math.round(fasesCount[key] / totalPecasSafe * 100) };
  }).sort((a, b) => b.value - a.value); 

  // Agrupar por fase (Peso)
  const totalPeso = displayData.reduce((acc, curr) => acc + parseFloat(curr.PESO || 0), 0);
  const pesoFase = displayData.reduce((acc, curr) => {
    const fase = String(curr.FASEATUAL || 'NÃO DEFINIDA');
    if (!acc[fase]) acc[fase] = 0;
    acc[fase] += parseFloat(curr.PESO || 0);
    return acc;
  }, {});
  
  const piePesoFase = Object.keys(pesoFase).map(key => {
    const totalPesoSafe = totalPeso || 1;
    const percentage = ((pesoFase[key] / totalPesoSafe) * 100).toFixed(1);
    return { name: `${key} - ${percentage}%`, originalName: key, value: Number(pesoFase[key].toFixed(2)) };
  }).sort((a, b) => b.value - a.value);

  // Material por Setor (Peso)
  const materialPorSetorMap = displayData.reduce((acc, curr) => {
    const fase = String(curr.FASEATUAL || 'NÃO DEFINIDA');
    const mat = String(curr.MATERIAL || 'N/A');
    if (!acc[fase]) acc[fase] = {};
    if (!acc[fase][mat]) acc[fase][mat] = 0;
    acc[fase][mat] += parseFloat(curr.PESO || 0);
    return acc;
  }, {});
  
  const materialPorSetorData = Object.keys(materialPorSetorMap).map(fase => {
    const obj = { name: fase };
    Object.keys(materialPorSetorMap[fase]).forEach(mat => {
      obj[mat] = Number(materialPorSetorMap[fase][mat].toFixed(2));
    });
    return obj;
  });
  
  const allMaterials = Array.from(new Set(displayData.map(d => String(d.MATERIAL || 'N/A'))));

  // Agrupar por Subcoleção (Qtd e Peso)
  const colecoesCount = displayData.reduce((acc, curr) => {
    if (!curr.SUBCOLECAO || String(curr.SUBCOLECAO).trim() === '') return acc; 
    const col = String(curr.SUBCOLECAO);
    if (!acc[col]) acc[col] = { Quantidade: 0, Peso: 0 };
    acc[col].Quantidade += Number(curr.QUANTIDADE || 0);
    acc[col].Peso += parseFloat(curr.PESO || 0);
    return acc;
  }, {});
  const subcolecoesData = Object.keys(colecoesCount).map(key => ({
    name: key,
    Quantidade: colecoesCount[key].Quantidade,
    Peso: Number(colecoesCount[key].Peso.toFixed(2))
  })).sort((a, b) => b.Quantidade - a.Quantidade); 

  // --- TEMPO NA FASE ---
  const today = new Date();
  
  // Adiciona a propriedade 'diasNaFase' aos itens
  const dataWithDays = displayData.map(d => {
    let diasNaFase = 0;
    if (d.DATAFASE) {
      const dataF = parseDateStr(d.DATAFASE);
      if (dataF && !isNaN(dataF.getTime())) {
        const diffTime = today - dataF;
        diasNaFase = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diasNaFase < 0 || isNaN(diasNaFase)) diasNaFase = 0; // Prevenção
      }
    }
    return { ...d, diasNaFase };
  });

  // KPI 1: Tempo Médio na Fase
  const totalDias = dataWithDays.reduce((acc, curr) => acc + curr.diasNaFase, 0);
  const tempoMedio = dataWithDays.length > 0 ? (totalDias / dataWithDays.length).toFixed(1) : 0;

  // Gráfico 2: Gargalos (Limite de 3 dias)
  let noPrazo = 0;
  let noLimite = 0;
  let emAtraso = 0;

  dataWithDays.forEach(d => {
    if (d.diasNaFase <= 2) noPrazo++;
    else if (d.diasNaFase === 3) noLimite++;
    else emAtraso++;
  });

  const gargalosData = [
    { name: 'No Prazo (Até 2 dias)', value: noPrazo, color: '#4ade80' },
    { name: 'No Limite (3 dias)', value: noLimite, color: '#fbbf24' },
    { name: 'Em Atraso (> 3 dias)', value: emAtraso, color: '#f87171' },
  ].filter(item => item.value > 0);

  // Lista 3: OPs Críticas
  const opsCriticas = [...dataWithDays]
    .filter(d => d.diasNaFase > 0)
    .sort((a, b) => b.diasNaFase - a.diasNaFase)
    .slice(0, 5);

  // Tooltip & Label customizados
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    if (percent < 0.04) return null; 
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const clearFilters = () => {
    setFilters({ dateStart: '', dateEnd: '', fases: [], colecoes: [], searchOP: '', pedido: '' });
  };

  const toggleCheckbox = (listName, item) => {
    setFilters(prev => {
      const list = prev[listName];
      if (list.includes(item)) return { ...prev, [listName]: list.filter(x => x !== item) };
      return { ...prev, [listName]: [...list, item] };
    });
  };

  const getModalDisplayItems = () => {
    if (!modal.isOpen) return [];
    let filtered = modal.items;
    
    // Search
    if (modalSearch.trim()) {
      const lowerSearch = modalSearch.toLowerCase();
      filtered = filtered.filter(item => {
        return (
          String(item.PEDIDO || '').toLowerCase().includes(lowerSearch) ||
          String(item.OP || '').toLowerCase().includes(lowerSearch) ||
          String(item.PRODUTO || '').toLowerCase().includes(lowerSearch) ||
          String(item.DESCRICAO || '').toLowerCase().includes(lowerSearch) ||
          String(item.MATERIAL || '').toLowerCase().includes(lowerSearch) ||
          String(item.FASEATUAL || '').toLowerCase().includes(lowerSearch) ||
          String(item.SUBCOLECAO || '').toLowerCase().includes(lowerSearch) ||
          String(item.DATAFASE ? parseDateStr(item.DATAFASE).toLocaleDateString('pt-BR') : '').includes(lowerSearch)
        );
      });
    }

    // Sort
    if (modalSort.key) {
      filtered = [...filtered].sort((a, b) => {
        let valA = a[modalSort.key];
        let valB = b[modalSort.key];

        if (modalSort.key === 'QUANTIDADE' || modalSort.key === 'PESO') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        } else if (modalSort.key === 'DATAFASE') {
          valA = parseDateStr(valA) ? parseDateStr(valA).getTime() : 0;
          valB = parseDateStr(valB) ? parseDateStr(valB).getTime() : 0;
        } else {
          valA = String(valA || '').toLowerCase();
          valB = String(valB || '').toLowerCase();
        }

        if (valA < valB) return modalSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return modalSort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  };

  const handleModalSort = (key) => {
    let direction = 'asc';
    if (modalSort.key === key && modalSort.direction === 'asc') {
      direction = 'desc';
    }
    setModalSort({ key, direction });
  };

  const modalDisplayItems = getModalDisplayItems();

  return (
    <div className="dashboard-layout">
      
      {/* MENU LATERAL DE FILTROS */}
      <div className="sidebar">
        <div className="sidebar-title">
          <ShieldCheck size={20} color="#60a5fa" /> Filtros
        </div>

        {/* --- SAVED VIEWS SECTION --- */}
        <div className="filter-group">
          <label>Salvar Visão Atual</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="text"
              className="filter-input"
              placeholder="Nome da visão..."
              value={newViewName}
              onChange={e => setNewViewName(e.target.value)}
              style={{ flex: 1, minWidth: 0 }}
            />
            <button 
              onClick={handleSaveView}
              className="btn-sidebar-save"
            >
              Salvar
            </button>
          </div>
          
          {savedViews.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
              <label>Minhas Visões</label>
              {savedViews.map((view, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1c1f26', padding: '6px 8px', borderRadius: '4px', border: '1px solid #2a2e39' }}>
                  <span 
                    onClick={() => handleLoadView(view)}
                    style={{ color: '#60a5fa', cursor: 'pointer', flex: 1, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    title="Carregar visão"
                  >
                    {view.name}
                  </span>
                  <button 
                    onClick={() => handleDeleteView(view.name)}
                    className="btn-delete-view"
                    title="Excluir visão"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <hr style={{ borderColor: '#2a2e39', borderStyle: 'solid', borderWidth: '1px 0 0 0', margin: '0 0 20px 0', width: '100%' }} />

        <div className="filter-group">
          <label>Buscar OP</label>
          <input 
            type="text" 
            className="filter-input"
            placeholder="Ex: 152710003" 
            value={filters.searchOP} 
            onChange={e => setFilters({...filters, searchOP: e.target.value})} 
          />
        </div>

        <div className="filter-group">
          <label>Pedido</label>
          <select 
            className="filter-input"
            value={filters.pedido} 
            onChange={e => setFilters({...filters, pedido: e.target.value})} 
          >
            <option value="">Todos</option>
            {availablePedidos.map(pedido => (
              <option key={pedido} value={pedido}>{pedido}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Data Inicial</label>
          <input 
            type="date" 
            className="filter-input"
            value={filters.dateStart} 
            onChange={e => setFilters({...filters, dateStart: e.target.value})} 
          />
        </div>

        <div className="filter-group">
          <label>Data Final</label>
          <input 
            type="date" 
            className="filter-input"
            value={filters.dateEnd} 
            onChange={e => setFilters({...filters, dateEnd: e.target.value})} 
          />
        </div>

        <div className="filter-group">
          <label>Setor / Fase</label>
          <div className="checkbox-list">
            {availableFases.map(fase => (
              <label key={fase} className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={filters.fases.includes(fase)}
                  onChange={() => toggleCheckbox('fases', fase)}
                />
                {fase}
              </label>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Coleção</label>
          <div className="checkbox-list">
            {availableColecoes.map(col => (
              <label key={col} className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={filters.colecoes.includes(col)}
                  onChange={() => toggleCheckbox('colecoes', col)}
                />
                {col}
              </label>
            ))}
          </div>
        </div>

        <button className="btn-clear-filters" onClick={clearFilters}>
          Limpar Filtros
        </button>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p>Controle do OP</p>
          </div>
          <div className="header-actions">
            {currentUser && currentUser.acesso === 'admin' && (
              <button className="btn-header btn-primary" onClick={() => navigate('/register')}>
                <UserPlus size={16} /> Cadastrar Usuário
              </button>
            )}
            <button className="btn-header btn-secondary" onClick={fetchData}>
              <RefreshCw size={16} /> Atualizar Base
            </button>
            <button className="btn-header btn-danger" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Total de OPs</span>
            <div className="kpi-icon bg-success"><CheckCircle size={16} /></div>
          </div>
          <div className="kpi-value">{totalOPs}</div>
          <span className="kpi-subtitle text-success">OPs em andamento</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Em Produção (Peças)</span>
            <div className="kpi-icon bg-purple"><Play size={16} /></div>
          </div>
          <div className="kpi-value">{totalPecas}</div>
          <span className="kpi-subtitle text-purple">Peças totais nas OPs</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Em Produção (Peso)</span>
            <div className="kpi-icon bg-info"><Box size={16} /></div>
          </div>
          <div className="kpi-value">{totalPeso.toFixed(2)} g</div>
          <span className="kpi-subtitle text-info">Peso total </span>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Total de Coleções</span>
            <div className="kpi-icon bg-warning"><Clock size={16} /></div>
          </div>
          <div className="kpi-value">{Object.keys(colecoesCount).length}</div>
          <span className="kpi-subtitle text-warning">Coleções em produção</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Tempo Médio na Fase</span>
            <div className="kpi-icon bg-danger"><Calendar size={16} /></div>
          </div>
          <div className="kpi-value">{tempoMedio} <span style={{fontSize: '14px', color: '#a0aab4'}}>dias</span></div>
          <span className="kpi-subtitle text-danger">Média de dias no setor</span>
        </div>
      </div>

      {/* LINHA 1 DE GRÁFICOS */}
      <div className="charts-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
        
        {/* Produção por Etapa */}
        <div className="chart-card">
          <h3 className="chart-title">Produção por Etapa (Peças)</h3>
          <div className="custom-list" style={{ maxHeight: '350px' }}>
            {pieData.map((item, index) => {
              const barWidth = Math.max(item.percentage, 2); // Garante um preenchimento visual mínimo de 2%
              return (
                <div className="list-item" key={index} onClick={() => openModal(`Etapa: ${item.originalName}`, displayData.filter(d => (d.FASEATUAL || 'NÃO DEFINIDA') === item.originalName))}>
                  <span className="list-name" title={item.originalName}>{item.originalName}</span>
                  <div className="list-bar-bg">
                    <div className="list-bar-fill" style={{ width: `${barWidth}%`, backgroundColor: COLORS[index % COLORS.length] }}></div>
                  </div>
                  <div className="list-values">
                    <span className="list-value-main">{item.value} pç</span>
                    <span className="list-value-sub">{item.percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Qtd por Setor */}
        <div className="chart-card">
          <h3 className="chart-title">(%)Quantidade de Peças por Setor</h3>
          <div style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="value" onClick={(e) => openModal(`Etapa: ${e.originalName}`, displayData.filter(d => (d.FASEATUAL || 'NÃO DEFINIDA') === e.originalName))} style={{ cursor: 'pointer' }} label={renderCustomLabel} labelLine={false}>
                  {pieData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1c1f26', borderColor: '#2a2e39', color: '#fff', borderRadius: '8px' }} />
                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '11px', color: '#a0aab4' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peso por Setor */}
        <div className="chart-card">
          <h3 className="chart-title">Peso por Setor (%)</h3>
          <div style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={piePesoFase} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="value" onClick={(e) => openModal(`Etapa: ${e.originalName}`, displayData.filter(d => (d.FASEATUAL || 'NÃO DEFINIDA') === e.originalName))} style={{ cursor: 'pointer' }} label={renderCustomLabel} labelLine={false}>
                  {piePesoFase.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1c1f26', borderColor: '#2a2e39', color: '#fff', borderRadius: '8px' }} />
                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '11px', color: '#a0aab4' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* LINHA 2 DE GRÁFICOS */}
      <div className="charts-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))' }}>
        
        {/* Produção por Subcoleção */}
        <div className="chart-card" style={{ flex: 2 }}>
          <h3 className="chart-title">Produção por Coleção</h3>
          <div className="custom-list" style={{ maxHeight: '400px' }}>
            {subcolecoesData.map((item, index) => {
              const percentage = Math.round((item.Quantidade / totalPecas) * 100) || 0;
              const barWidth = Math.max(percentage, 2); // Preenchimento mínimo visual
              return (
                <div className="list-item" key={index} onClick={() => openModal(`Subcoleção: ${item.name}`, displayData.filter(d => d.SUBCOLECAO === item.name))}>
                  <span className="list-name" title={item.name} style={{ width: '180px' }}>{item.name}</span>
                  <div className="list-bar-bg">
                    <div className="list-bar-fill" style={{ width: `${barWidth}%`, backgroundColor: COLORS[index % COLORS.length] }}></div>
                  </div>
                  <div className="list-values" style={{ width: '120px', flexDirection: 'row', justifyContent: 'flex-end', gap: '16px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span className="list-value-main">{item.Quantidade} pç</span>
                      <span className="list-value-sub">{percentage}%</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span className="list-value-main" style={{ color: '#4ade80' }}>{item.Peso} g</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Material por Setor (Gráfico de Barras Empilhadas) */}
        <div className="chart-card" style={{ flex: 2 }}>
          <h3 className="chart-title">Peso de Material por Setor (g)</h3>
          <div style={{ height: '400px', overflowY: 'auto' }}>
            <div style={{ height: `${Math.max(400, materialPorSetorData.length * 40)}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={materialPorSetorData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" horizontal={false} />
                  <XAxis type="number" stroke="#a0aab4" />
                  <YAxis dataKey="name" type="category" stroke="#a0aab4" width={100} tick={{fontSize: 11}} />
                  <Tooltip contentStyle={{ backgroundColor: '#1c1f26', borderColor: '#2a2e39', color: '#fff', borderRadius: '8px' }} cursor={{fill: '#2a2e39'}} />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#a0aab4' }} />
                  {allMaterials.map((mat, i) => (
                    <Bar 
                      key={mat} 
                      dataKey={mat} 
                      stackId="a" 
                      fill={MATERIAL_COLORS[i % MATERIAL_COLORS.length]} 
                      barSize={20}
                      onClick={(entry) => openModal(`Material: ${mat} (Setor: ${entry.name})`, displayData.filter(d => d.MATERIAL === mat && (d.FASEATUAL || 'NÃO DEFINIDA') === entry.name))}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
      </div>

      {/* LINHA 3 DE GRÁFICOS (TEMPO NA FASE) */}
      <div className="charts-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
        
        {/* Gráfico de Gargalos */}
        <div className="chart-card">
          <h3 className="chart-title">Tempo de Permanência no Setor </h3>
          <div style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gargalosData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  onClick={(entry) => openModal(`OPs paradas: ${entry.name}`, dataWithDays.filter(d => {
                    if (entry.name === 'No Prazo (Até 2 dias)') return d.diasNaFase <= 2;
                    if (entry.name === 'No Limite (3 dias)') return d.diasNaFase === 3;
                    return d.diasNaFase > 3;
                  }))}
                  style={{ cursor: 'pointer' }}
                >
                  {gargalosData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1c1f26', borderColor: '#2a2e39', color: '#fff', borderRadius: '8px' }} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', color: '#a0aab4' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* OPs Críticas */}
        <div className="chart-card">
          <h3 className="chart-title">Top 5 OPs Críticas (Mais Antigas no Setor)</h3>
          <div className="custom-list" style={{ maxHeight: '350px' }}>
            {opsCriticas.length === 0 ? (
              <div style={{ color: '#a0aab4', padding: '20px', textAlign: 'center' }}>Nenhuma OP com data</div>
            ) : opsCriticas.map((item, index) => {
              return (
                <div className="list-item" key={index} onClick={() => openModal(`Detalhes OP: ${item.OP}`, dataWithDays.filter(d => d.OP === item.OP))}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '60%' }}>
                    <span className="list-name" style={{ color: '#f87171' }}>OP {item.OP}</span>
                    <span className="list-value-sub" style={{ fontSize: '11px' }}>Setor: {item.FASEATUAL}</span>
                    <span className="list-value-sub" style={{ fontSize: '11px' }}>Entrada: {item.DATAFASE ? parseDateStr(item.DATAFASE).toLocaleDateString('pt-BR') : '-'}</span>
                  </div>
                  <div className="list-values" style={{ width: '40%', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <span className="list-value-main" style={{ color: '#f87171', fontSize: '16px' }}>{item.diasNaFase} dias</span>
                    <span className="list-value-sub" style={{ color: '#a0aab4' }}>parada</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {modal.isOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>{modal.title} ({modalDisplayItems.length} Ordens)</h2>
                <button className="modal-close-btn" onClick={closeModal}><X size={20} /></button>
              </div>
              <input 
                type="text" 
                className="filter-input"
                placeholder="Pesquisar por OP, Produto, Descrição..."
                value={modalSearch}
                onChange={e => setModalSearch(e.target.value)}
              />
            </div>
            <div className="modal-body">
              <table className="modal-table">
                <thead>
                  <tr>
                    <th onClick={() => handleModalSort('PEDIDO')} style={{ cursor: 'pointer' }}>Pedido {modalSort.key === 'PEDIDO' ? (modalSort.direction === 'asc' ? '↑' : '↓') : ''}</th>
                    <th onClick={() => handleModalSort('OP')} style={{ cursor: 'pointer' }}>OP {modalSort.key === 'OP' ? (modalSort.direction === 'asc' ? '↑' : '↓') : ''}</th>
                    <th onClick={() => handleModalSort('PRODUTO')} style={{ cursor: 'pointer' }}>Produto {modalSort.key === 'PRODUTO' ? (modalSort.direction === 'asc' ? '↑' : '↓') : ''}</th>
                    <th onClick={() => handleModalSort('DESCRICAO')} style={{ cursor: 'pointer' }}>Descrição {modalSort.key === 'DESCRICAO' ? (modalSort.direction === 'asc' ? '↑' : '↓') : ''}</th>
                    <th onClick={() => handleModalSort('MATERIAL')} style={{ cursor: 'pointer' }}>Material {modalSort.key === 'MATERIAL' ? (modalSort.direction === 'asc' ? '↑' : '↓') : ''}</th>
                    <th onClick={() => handleModalSort('FASEATUAL')} style={{ cursor: 'pointer' }}>Fase Atual {modalSort.key === 'FASEATUAL' ? (modalSort.direction === 'asc' ? '↑' : '↓') : ''}</th>
                    <th onClick={() => handleModalSort('DATAFASE')} style={{ cursor: 'pointer' }}>Data na Fase {modalSort.key === 'DATAFASE' ? (modalSort.direction === 'asc' ? '↑' : '↓') : ''}</th>
                    <th onClick={() => handleModalSort('SUBCOLECAO')} style={{ cursor: 'pointer' }}>Subcoleção {modalSort.key === 'SUBCOLECAO' ? (modalSort.direction === 'asc' ? '↑' : '↓') : ''}</th>
                    <th onClick={() => handleModalSort('QUANTIDADE')} style={{ cursor: 'pointer' }}>Qtd {modalSort.key === 'QUANTIDADE' ? (modalSort.direction === 'asc' ? '↑' : '↓') : ''}</th>
                    <th onClick={() => handleModalSort('PESO')} style={{ cursor: 'pointer' }}>Peso (g) {modalSort.key === 'PESO' ? (modalSort.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  </tr>
                </thead>
                <tbody>
                  {modalDisplayItems.map((item, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{item.PEDIDO || '-'}</td>
                      <td style={{ fontWeight: 500, color: '#60a5fa' }}>{item.OP}</td>
                      <td>{item.PRODUTO}</td>
                      <td>{item.DESCRICAO}</td>
                      <td style={{ color: '#fbbf24' }}>{item.MATERIAL || '-'}</td>
                      <td>{item.FASEATUAL}</td>
                      <td>{item.DATAFASE ? parseDateStr(item.DATAFASE).toLocaleDateString('pt-BR') : '-'}</td>
                      <td>{item.SUBCOLECAO || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{item.QUANTIDADE}</td>
                      <td style={{ color: '#4ade80' }}>{item.PESO ? Number(item.PESO).toFixed(2) : '0.00'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

export default Dashboard;
