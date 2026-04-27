// App.jsx — Uygulama kök bileşeni.
//
// Ghost node düzeltmesi:
//   - App.jsx sadece API sonuçlarını tutar (analyzedNodes / analyzedEdges).
//   - Manuel node ekleme/silme state'i tamamen FlowCanvas içindedir.
//   - Sidebar'daki "Ekle" butonu → App.jsx → addNodeRef.current() →
//     FlowCanvas'ın iç setNodes'unu çağırır.
//   - Bu sayede iki ayrı state kaynağının çakışması tamamen ortadan kalkar.

import { useState, useRef } from 'react';
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

  // API sonuçları — FlowCanvas bunları "analiz yükü" olarak alır
  const [analyzedNodes, setAnalyzedNodes] = useState([]);
  const [analyzedEdges, setAnalyzedEdges] = useState([]);

  // FlowCanvas'ın iç addNode fonksiyonuna erişmek için ref köprüsü
  // FlowCanvas bu ref'i kendi addNode impl'i ile dolduracak
  const addNodeRef = useRef(null);

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
      if (window.innerWidth < 768) setSidebarOpen(false);
    } catch (err) {
      setError(err.message ?? 'Bilinmeyen bir hata oluştu.');
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
        </div>
      </div>
    </ReactFlowProvider>
  );
}