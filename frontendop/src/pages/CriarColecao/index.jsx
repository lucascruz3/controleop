import { useState, useRef } from 'react';
import { Layout } from '../../components/Layout';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  PlusCircle, 
  XCircle, 
  FolderPlus, 
  ArrowLeft, 
  Image as ImageIcon, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Trash2, 
  Sparkles,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import './CriarColecao.css';

export function CriarColecao() {
  const navigate = useNavigate();
  const [novaColecao, setNovaColecao] = useState({ nome: '', descricao: '' });
  
  // Capa principal da coleção
  const [capaFile, setCapaFile] = useState(null);
  const [capaPreview, setCapaPreview] = useState(null);
  const capaInputRef = useRef(null);

  // Ficha técnica da coleção (PDF, Excel, Doc, Imagem)
  const [fichaTecnicaFile, setFichaTecnicaFile] = useState(null);
  const fichaInputRef = useRef(null);

  // Linhas e Produtos
  const [linhas, setLinhas] = useState([
    { id: 1, nome: 'Linha Principal', produtos: [{ id: 11, nome: '', arquivo: null, preview: null }] }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manipulação da Imagem de Capa
  const handleCapaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCapaFile(file);
      setCapaPreview(URL.createObjectURL(file));
    }
  };

  const removeCapa = () => {
    setCapaFile(null);
    if (capaPreview) URL.revokeObjectURL(capaPreview);
    setCapaPreview(null);
    if (capaInputRef.current) capaInputRef.current.value = '';
  };

  // Manipulação da Ficha Técnica
  const handleFichaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFichaTecnicaFile(file);
    }
  };

  const removeFicha = () => {
    setFichaTecnicaFile(null);
    if (fichaInputRef.current) fichaInputRef.current.value = '';
  };

  // Linhas & Produtos
  const addLinha = () => {
    setLinhas([
      ...linhas, 
      { id: Date.now(), nome: '', produtos: [{ id: Date.now() + 1, nome: '', arquivo: null, preview: null }] }
    ]);
  };

  const removeLinha = (idLinha) => {
    setLinhas(linhas.filter(l => l.id !== idLinha));
  };

  const addProduto = (idLinha) => {
    setLinhas(linhas.map(l => {
      if (l.id === idLinha) {
        return { 
          ...l, 
          produtos: [...l.produtos, { id: Date.now(), nome: '', arquivo: null, preview: null }] 
        };
      }
      return l;
    }));
  };

  const removeProduto = (idLinha, idProduto) => {
    setLinhas(linhas.map(l => {
      if (l.id === idLinha) {
        return { ...l, produtos: l.produtos.filter(p => p.id !== idProduto) };
      }
      return l;
    }));
  };

  const updateProduto = (idLinha, idProduto, field, value) => {
    setLinhas(linhas.map(l => {
      if (l.id === idLinha) {
        return {
          ...l,
          produtos: l.produtos.map(p => {
            if (p.id === idProduto) {
              if (field === 'arquivo' && value) {
                const preview = value.type.startsWith('image/') ? URL.createObjectURL(value) : null;
                return { ...p, arquivo: value, preview };
              }
              return { ...p, [field]: value };
            }
            return p;
          })
        };
      }
      return l;
    }));
  };

  // Salvar Coleção
  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!novaColecao.nome.trim()) {
      alert('Por favor, informe o nome da coleção.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('@controloop:token');
      
      // Monta multipart FormData com nome, descrição, capa e ficha técnica
      const formData = new FormData();
      formData.append('nome', novaColecao.nome);
      formData.append('descricao', novaColecao.descricao);

      if (capaFile) {
        formData.append('capa', capaFile);
      }

      if (fichaTecnicaFile) {
        formData.append('fichaTecnica', fichaTecnicaFile);
      }

      const res = await axios.post('http://localhost:3003/api/projetos', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const novoProjetoId = res.data.id;

      // Anexa imagens e arquivos individuais dos produtos caso existam
      for (const linha of linhas) {
        for (const prod of linha.produtos) {
          if (prod.arquivo) {
            try {
              const prodFormData = new FormData();
              prodFormData.append('file', prod.arquivo);
              prodFormData.append('faseInsercao', 'PRODUTO');
              await axios.post(`http://localhost:3003/api/projetos/${novoProjetoId}/anexo`, prodFormData, {
                headers: { 
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'multipart/form-data'
                }
              });
            } catch (errProd) {
              console.warn('Erro ao anexar arquivo de produto:', prod.nome, errProd);
            }
          }
        }
      }

      navigate('/pre-producao');
    } catch (error) {
      console.error('Erro ao criar coleção:', error);
      alert('Erro ao criar coleção. Verifique sua conexão e permissões.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <Layout>
      <div className="criar-colecao-container">
        {/* Header da Página */}
        <header className="page-header-luxury">
          <button type="button" className="btn-back" onClick={() => navigate('/pre-producao')}>
            <ArrowLeft size={18} /> Voltar 
          </button>
          
          <div className="title-wrapper-luxury">
            <div className="title-icon-box">
              <Sparkles size={22} />
            </div>
            <div>
              <h1>Nova Coleção de Joias</h1>
              <p>Cadastre o conceito, anexe a ficha técnica e estruture os produtos.</p>
            </div>
          </div>
        </header>

        <form onSubmit={handleCreateCollection} className="form-colecao">
          
          {/* SEÇÃO 1: DADOS DA COLEÇÃO */}
          <div className="card-form-luxury">
            <div className="card-section-title">
              <span className="step-badge">1</span>
              <h2>Conceito & Detalhes da Coleção</h2>
            </div>

            <div className="form-group">
              <label>Nome da Coleção / Linha <span className="required-star">*</span></label>
              <input 
                type="text" 
                required 
                value={novaColecao.nome} 
                onChange={e => setNovaColecao({...novaColecao, nome: e.target.value})} 
                placeholder="Ex: Coleção Sublime 2026 - Alta Joalheria em Ouro 18k"
                className="input-luxury"
              />
            </div>

            <div className="form-group">
              <label>Briefing Criativo & Inspiração</label>
              <textarea 
                rows="3" 
                value={novaColecao.descricao} 
                onChange={e => setNovaColecao({...novaColecao, descricao: e.target.value})} 
                placeholder="Descreva as pedras, referências estéticas, lapidações e o conceito criativo..."
                className="textarea-luxury"
              ></textarea>
            </div>
          </div>

          {/* SEÇÃO 2: CAPA PRINCIPAL (IMAGEM DA COLEÇÃO) */}
          <div className="card-form-luxury">
            <div className="card-section-title">
              <span className="step-badge">2</span>
              <h2>Capa Visual da Coleção (Imagem de Destaque)</h2>
            </div>
            <p className="section-hint">
              Esta imagem será exibida em tamanho grande no quadro de pré-produção para identificar a coleção.
            </p>

            <input 
              type="file" 
              ref={capaInputRef}
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handleCapaChange}
            />

            {capaPreview ? (
              <div className="capa-preview-card">
                <div 
                  className="capa-preview-img" 
                  style={{ backgroundImage: `url(${capaPreview})` }}
                />
                <div className="capa-preview-info">
                  <div className="capa-preview-meta">
                    <CheckCircle2 size={18} className="text-success" />
                    <div>
                      <span className="capa-file-name">{capaFile.name}</span>
                      <span className="capa-file-size">{formatFileSize(capaFile.size)}</span>
                    </div>
                  </div>
                  <div className="capa-actions">
                    <button 
                      type="button" 
                      className="btn-change-file" 
                      onClick={() => capaInputRef.current?.click()}
                    >
                      Trocar Imagem
                    </button>
                    <button 
                      type="button" 
                      className="btn-remove-file" 
                      onClick={removeCapa}
                      title="Remover Capa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className="dropzone-luxury"
                onClick={() => capaInputRef.current?.click()}
              >
                <div className="dropzone-icon-box">
                  <UploadCloud size={32} />
                </div>
                <div className="dropzone-text">
                  <span className="dropzone-main-text">Clique para selecionar a Imagem de Capa</span>
                  <span className="dropzone-sub-text">PNG, JPG, WEBP de alta qualidade (recomendado 800x500px ou superior)</span>
                </div>
                <button type="button" className="btn-browse-file">
                  <ImageIcon size={16} /> Escolher Imagem
                </button>
              </div>
            )}
          </div>

          {/* SEÇÃO 3: FICHA TÉCNICA DA COLEÇÃO */}
          <div className="card-form-luxury">
            <div className="card-section-title">
              <span className="step-badge">3</span>
              <h2>Ficha Técnica da Coleção (PDF / Excel / Documento)</h2>
            </div>
            <p className="section-hint">
              Anexe o arquivo da ficha técnica com especificações de peso, teor do metal, gemas, cravações ou custos.
            </p>

            <input 
              type="file" 
              ref={fichaInputRef}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" 
              style={{ display: 'none' }} 
              onChange={handleFichaChange}
            />

            {fichaTecnicaFile ? (
              <div className="ficha-preview-card">
                <div className="ficha-icon-box">
                  {fichaTecnicaFile.name.endsWith('.xlsx') || fichaTecnicaFile.name.endsWith('.xls') ? (
                    <FileSpreadsheet size={28} className="text-emerald" />
                  ) : (
                    <FileText size={28} className="text-sky" />
                  )}
                </div>

                <div className="ficha-info">
                  <span className="ficha-name">{fichaTecnicaFile.name}</span>
                  <span className="ficha-size">{formatFileSize(fichaTecnicaFile.size)} • Documento Anexado</span>
                </div>

                <div className="ficha-actions">
                  <span className="badge-ready">
                    <CheckCircle2 size={14} /> Ficha Carregada
                  </span>
                  <button 
                    type="button" 
                    className="btn-remove-file" 
                    onClick={removeFicha}
                    title="Remover Ficha Técnica"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className="dropzone-ficha"
                onClick={() => fichaInputRef.current?.click()}
              >
                <div className="dropzone-icon-box ficha-icon-theme">
                  <FileText size={28} />
                </div>
                <div className="dropzone-text">
                  <span className="dropzone-main-text">Fazer upload da Ficha Técnica</span>
                  <span className="dropzone-sub-text">Formatos aceitos: PDF, Excel (.xlsx/.xls), Word (.docx) ou Imagem</span>
                </div>
                <button type="button" className="btn-browse-file">
                  Subir Arquivo
                </button>
              </div>
            )}
          </div>

          {/* SEÇÃO 4: ESTRUTURA DE PRODUTOS E LINHAS */}
          <div className="card-form-luxury">
            <div className="section-header-row-luxury">
              <div className="card-section-title">
                <span className="step-badge">4</span>
                <h2>Peças & Produtos da Coleção</h2>
              </div>
              <button type="button" className="btn-add-linha-luxury" onClick={addLinha}>
                <FolderPlus size={16} /> Nova Linha
              </button>
            </div>
            
            <p className="section-hint">
              Adicione cada joia individualmente. Você pode anexar uma foto de referência para cada produto para aparecer nas miniaturas!
            </p>

            <div className="linhas-container-luxury">
              {linhas.map((linha, lIndex) => (
                <div key={linha.id} className="linha-card-luxury">
                  <div className="linha-header-luxury">
                    <div className="linha-title-group">
                      <div className="linha-tag">
                        <Layers size={14} /> Linha {lIndex + 1}
                      </div>
                      <input 
                        type="text" 
                        placeholder="Nome da Linha (Ex: Linha Noivas, Linha Riviera)" 
                        value={linha.nome}
                        onChange={(e) => {
                          const newLinhas = [...linhas];
                          newLinhas[lIndex].nome = e.target.value;
                          setLinhas(newLinhas);
                        }}
                        required
                        className="input-linha-nome-luxury"
                      />
                    </div>
                    {linhas.length > 1 && (
                      <button 
                        type="button" 
                        className="btn-remove-linha-luxury" 
                        onClick={() => removeLinha(linha.id)} 
                        title="Remover Linha"
                      >
                        <XCircle size={18} /> Remover Linha
                      </button>
                    )}
                  </div>

                  <div className="products-table-luxury">
                    {linha.produtos.map((p, pIndex) => (
                      <div key={p.id} className="product-item-luxury">
                        <div className="product-number-luxury">{pIndex + 1}</div>
                        
                        {/* Preview miniatura da foto do produto */}
                        {p.preview && (
                          <div className="product-mini-thumb">
                            <img src={p.preview} alt="Prévia da peça" />
                          </div>
                        )}

                        <div className="product-input-group-luxury">
                          <input 
                            type="text" 
                            placeholder="Nome do Produto / Peça (Ex: Anel Solitário Diamante 1ct)" 
                            value={p.nome}
                            onChange={(e) => updateProduto(linha.id, p.id, 'nome', e.target.value)}
                            required
                          />
                        </div>

                        <div className="product-actions-luxury">
                          <label className={`btn-upload-product ${p.arquivo ? 'has-file' : ''}`}>
                            <input 
                              type="file" 
                              accept="image/*"
                              style={{ display: 'none' }} 
                              onChange={(e) => {
                                if (e.target.files[0]) {
                                  updateProduto(linha.id, p.id, 'arquivo', e.target.files[0]);
                                }
                              }} 
                            />
                            <ImageIcon size={16} />
                            <span>{p.arquivo ? 'Foto Anexada' : 'Foto da Peça'}</span>
                          </label>

                          <button 
                            type="button" 
                            className="btn-remove-product" 
                            onClick={() => removeProduto(linha.id, p.id)} 
                            title="Remover Peça"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    type="button" 
                    className="btn-add-product-nested-luxury" 
                    onClick={() => addProduto(linha.id)}
                  >
                    <PlusCircle size={16} /> Adicionar Nova Peça nesta Linha
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* RODAPÉ DO FORMULÁRIO */}
          <div className="form-footer-luxury">
            <button 
              type="button" 
              className="btn-cancel-luxury" 
              onClick={() => navigate('/pre-producao')}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-submit-luxury" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>Salvando Coleção e Arquivos...</span>
              ) : (
                <span>Salvar Coleção</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
