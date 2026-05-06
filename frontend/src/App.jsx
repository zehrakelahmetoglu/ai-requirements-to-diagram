// App.jsx — Uygulama kök bileşeni.
//
// Ghost node düzeltmesi:
//   - App.jsx sadece API sonuçlarını tutar (analyzedNodes / analyzedEdges).
//   - Manuel node ekleme/silme state'i tamamen FlowCanvas içindedir.
//   - Sidebar'daki "Ekle" butonu → App.jsx → addNodeRef.current() →
//     FlowCanvas'ın iç setNodes'unu çağırır.
//   - Bu sayede iki ayrı state kaynağının çakışması tamamen ortadan kalkar.

import { useState, useRef, useCallback } from 'react';
import { ReactFlowProvider } from 'reactflow';

import Sidebar    from './components/Sidebar';
import FlowCanvas from './components/FlowCanvas';
import { analyzeRequirements } from './services/api';
import { mapToReactFlow }      from './utils/diagramMapper';

export default function App() {
  // ── Global State ────────────────────────────────────────────────────────────
  const [inputText, setInputText]         = useState('');
  const [diagramType, setDiagramType]     = useState('class');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [sidebarOpen, setSidebarOpen]     = useState(true);

  const [analyzedNodes, setAnalyzedNodes] = useState([]);
  const [analyzedEdges, setAnalyzedEdges] = useState([]);

  // Toast bildirimi state'i
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }

  // FlowCanvas'ın iç addNode fonksiyonuna erişmek için ref köprüsü
  const addNodeRef = useRef(null);

  // Toast gösterme yardımcısı (3 sn sonra otomatik kaybolur)
  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Analiz İsteği ───────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const backendData = await analyzeRequirements(inputText, diagramType);
      const { nodes: newNodes, edges: newEdges } = mapToReactFlow(backendData);
      setAnalyzedNodes(newNodes);
      setAnalyzedEdges(newEdges);
      showToast('success', `${newNodes.length} düğüm oluşturuldu ✓`);
      if (window.innerWidth < 768) setSidebarOpen(false);
    } catch (err) {
      const msg = err.message ?? 'Bilinmeyen bir hata oluştu.';
      setError(msg);
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Manuel Düğüm Ekleme (FlowCanvas'ın iç state'ine yönlendirilir) ─────────
  const handleAddNode = () => {
    addNodeRef.current?.(diagramType);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <ReactFlowProvider>
      <div className={`app-layout ${sidebarOpen ? '' : 'app-layout--collapsed'}`}>
        {sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <Sidebar
          inputText={inputText}
          onInputChange={setInputText}
          diagramType={diagramType}
          onDiagramTypeChange={setDiagramType}
          onAnalyze={handleAnalyze}
          onAddNode={handleAddNode}
          loading={loading}
          error={error}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="canvas-wrapper">
          <button
            id="sidebar-toggle-btn"
            className={`sidebar-toggle ${sidebarOpen ? 'sidebar-toggle--open' : ''}`}
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Paneli aç/kapat"
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>

          <FlowCanvas
            analyzedNodes={analyzedNodes}
            analyzedEdges={analyzedEdges}
            addNodeRef={addNodeRef}
          />

          {/* Toast bildirimi */}
          {toast && (
            <div className={`toast toast--${toast.type}`} role="alert">
              <span className="toast__icon">
                {toast.type === 'success' ? '✓' : '⚠'}
              </span>
              {toast.message}
            </div>
          )}
        </div>
      </div>
    </ReactFlowProvider>
  );
}