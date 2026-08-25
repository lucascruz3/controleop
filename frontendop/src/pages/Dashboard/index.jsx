import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, CheckCircle, Clock, PauseCircle, Box, ShieldCheck, 
  RefreshCw, Calendar, X
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import './dashboard.css';

const COLORS = ['#60a5fa', '#4ade80', '#f87171', '#fbbf24', '#a78bfa', '#ec4899', '#38bdf8', '#c084fc', '#f472b6'];

export function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado do Modal
  const [modal, setModal] = useState({ isOpen: false, title: '', items: [] });

  // Estado dos Filtros
  const [filters, setFilters] = useState({
    dateStart: '',
    dateEnd: '',
    fases: [],
    colecoes: [],
    searchOP: ''
  });

  const openModal = (title, filterFn) => {
    const items = data.filter(filterFn);
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
  }, [navigate]);

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
    const [day, month, year] = String(dateStr).split('/');
    return new Date(`${year}-${month}-${day}T00:00:00`);
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
  const availableColecoes = Array.from(new Set(filteredData.map(d => String(d.COLECAO || 'NÃO DEFINIDA')))).sort();

  // Aplicação dos filtros do Menu Lateral
  const displayData = filteredData.filter(d => {
    if (filters.searchOP && !String(d.OP || '').toLowerCase().includes(filters.searchOP.toLowerCase())) return false;
    
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
    if (filters.colecoes.length > 0 && !filters.colecoes.includes(String(d.COLECAO || 'NÃO DEFINIDA'))) return false;

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
    setFilters({ dateStart: '', dateEnd: '', fases: [], colecoes: [], searchOP: '' });
  };

  const toggleCheckbox = (listName, item) => {
    setFilters(prev => {
      const list = prev[listName];
      if (list.includes(item)) return { ...prev, [listName]: list.filter(x => x !== item) };
      return { ...prev, [listName]: [...list, item] };
    });
  };

  return (
    <div className="dashboard-layout">
      
      {/* MENU LATERAL DE FILTROS */}
      <div className="sidebar">
        <div className="sidebar-title">
          <ShieldCheck size={20} color="#60a5fa" /> Filtros
        </div>

        <div className="filter-group">
          <label>Buscar OP</label>
          <input 
            type="text" 
            className="filter-input"
            placeholder="Ex: 12345" 
            value={filters.searchOP} 
            onChange={e => setFilters({...filters, searchOP: e.target.value})} 
          />
        </div>

        <div className="filter-group">
          <label>Abertura (Início)</label>
          <input 
            type="date" 
            className="filter-input"
            value={filters.dateStart} 
            onChange={e => setFilters({...filters, dateStart: e.target.value})} 
          />
        </div>

        <div className="filter-group">
          <label>Abertura (Fim)</label>
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
            <p>Visão geral da Produção - Total de {totalOPs} OPs em andamento</p>
          </div>
          <div className="header-actions">
            <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', color: '#a0aab4', border: '1px solid #2a2e39', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
              <RefreshCw size={16} /> Atualizar Base
            </button>
            <button onClick={handleLogout} style={{ background: '#f87171', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
              Sair
            </button>
          </div>
        </div>

      <div className="kpi-grid">
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
          <span className="kpi-subtitle text-info">Peso total nas OPs</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Fases Ativas</span>
            <div className="kpi-icon bg-warning"><Clock size={16} /></div>
          </div>
          <div className="kpi-value">{Object.keys(fasesCount).length}</div>
          <span className="kpi-subtitle text-warning">Setores em operação</span>
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
                <div className="list-item" key={index} onClick={() => openModal(`Etapa: ${item.originalName}`, d => (d.FASEATUAL || 'NÃO DEFINIDA') === item.originalName)}>
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
          <h3 className="chart-title">Qtd de Peças por Setor</h3>
          <div style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="value" onClick={(e) => openModal(`Etapa: ${e.originalName}`, d => (d.FASEATUAL || 'NÃO DEFINIDA') === e.originalName)} style={{ cursor: 'pointer' }} label={renderCustomLabel} labelLine={false}>
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
          <h3 className="chart-title">Peso por Setor (g)</h3>
          <div style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={piePesoFase} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="value" onClick={(e) => openModal(`Etapa: ${e.originalName}`, d => (d.FASEATUAL || 'NÃO DEFINIDA') === e.originalName)} style={{ cursor: 'pointer' }} label={renderCustomLabel} labelLine={false}>
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
                <div className="list-item" key={index} onClick={() => openModal(`Subcoleção: ${item.name}`, d => d.SUBCOLECAO === item.name)}>
                  <span className="list-name" title={item.name} style={{ width: '180px' }}>{item.name}</span>
                  <div className="list-bar-bg">
                    <div className="list-bar-fill" style={{ width: `${barWidth}%`, backgroundColor: COLORS[(index+3) % COLORS.length] }}></div>
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
                      fill={COLORS[(i+4) % COLORS.length]} 
                      barSize={20}
                      onClick={(entry) => openModal(`Material: ${mat} (Setor: ${entry.name})`, d => d.MATERIAL === mat && (d.FASEATUAL || 'NÃO DEFINIDA') === entry.name)}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
      </div>

      {/* MODAL */}
      {modal.isOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modal.title} ({modal.items.length} Ordens)</h2>
              <button className="modal-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <table className="modal-table">
                <thead>
                  <tr>
                    <th>OP</th>
                    <th>Produto</th>
                    <th>Descrição</th>
                    <th>Material</th>
                    <th>Fase Atual</th>
                    <th>Subcoleção</th>
                    <th>Qtd</th>
                    <th>Peso (g)</th>
                  </tr>
                </thead>
                <tbody>
                  {modal.items.map((item, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500, color: '#60a5fa' }}>{item.OP}</td>
                      <td>{item.PRODUTO}</td>
                      <td>{item.DESCRICAO}</td>
                      <td style={{ color: '#fbbf24' }}>{item.MATERIAL || '-'}</td>
                      <td>{item.FASEATUAL}</td>
                      <td>{item.SUBCOLECAO || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{item.QUANTIDADE}</td>
                      <td>{item.PESO ? Number(item.PESO).toFixed(2) : '0.00'}</td>
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
